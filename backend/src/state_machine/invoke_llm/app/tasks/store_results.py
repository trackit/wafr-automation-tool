import json
import logging
from typing import Any, override

from common.config import (
    ASSESSMENT_PK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    STORE_CHUNK_PATH,
)
from common.entities import FindingExtra
from common.task import Task
from services.database import IDatabaseService
from services.storage import IStorageService
from utils import s3
from utils.questions import retrieve_questions

from state_machine.event import StoreResultsInput

logger = logging.getLogger("StoreResults")


class StoreResults(Task[StoreResultsInput, None]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.questions = retrieve_questions().questions

    def retrieve_findings_data(
        self,
        assessment_id: str,
        chunk_id: int,
        s3_bucket: str,
    ) -> list[FindingExtra]:
        key = STORE_CHUNK_PATH.format(assessment_id, chunk_id)
        chunk_content = self.storage_service.get(Bucket=s3_bucket, Key=key)
        return [FindingExtra(**item) for item in json.loads(chunk_content)]

    def verify_data(self, pillar_name: str, question_name: str, bp_name: str) -> bool:
        return (
            pillar_name in self.questions
            and question_name in self.questions[pillar_name]
            and bp_name in self.questions[pillar_name][question_name]
        )

    def store_finding_ids(
        self,
        assessment_id: str,
        pillar_name: str,
        question_name: str,
        bp_name: str,
        bp_finding_ids: list[str],
    ) -> None:
        if not bp_finding_ids:
            return
        if not self.verify_data(pillar_name, question_name, bp_name):
            logger.error(
                "Data not found for pillar: %s, question: %s, best practice: %s",
                pillar_name,
                question_name,
                bp_name,
            )
            return
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            UpdateExpression="SET findings.#pillar.#question.#bp = list_append(if_not_exists(findings.#pillar.#question.#bp, :empty_list), :new_findings)",  # noqa: E501
            ExpressionAttributeNames={
                "#pillar": pillar_name,
                "#question": question_name,
                "#bp": bp_name,
            },
            ExpressionAttributeValues={
                ":new_findings": bp_finding_ids,
                ":empty_list": [],
            },
        )

    def store_findings(
        self,
        assessment_id: str,
        bp_finding_ids: list[str],
        findings_data: list[FindingExtra],
    ) -> None:
        for finding_id in bp_finding_ids:
            finding_data: FindingExtra | None = next(
                (item for item in findings_data if item.id == finding_id),
                None,
            )
            if finding_data is None:
                logger.error("Finding with id %s not found", finding_id)
                continue
            finding_dict = finding_data.model_dump(exclude={"id"}).copy()
            self.database_service.put(
                table_name=DDB_TABLE,
                item={
                    **finding_dict,
                    DDB_KEY: assessment_id,
                    DDB_SORT_KEY: finding_id,
                },
            )

    def store_results(
        self,
        assessment_id: str,
        findings: dict[str, Any],
        findings_data: list[FindingExtra],
    ) -> None:
        for pillar_name, pillar in findings.items():
            for question_name, question in pillar.items():
                for bp_name in question:
                    bp_finding_ids: list[str] = [
                        str(finding_id) for finding_id in findings[pillar_name][question_name][bp_name]
                    ]
                    self.store_finding_ids(assessment_id, pillar_name, question_name, bp_name, bp_finding_ids)
                    self.store_findings(assessment_id, bp_finding_ids, findings_data)

    def ensure_text_format(self, llm_response: str) -> str:
        return llm_response.replace("\n", "")

    def concat_results(self, llm_response: str) -> dict[str, Any]:
        json_body = json.loads(llm_response)
        contents = json_body["content"]
        findings: dict[str, Any] = {}
        for content in contents:
            llm_result = self.ensure_text_format(content["text"])
            try:
                obj = json.loads(llm_result)
                findings.update(obj)
            except json.JSONDecodeError:
                continue
        return findings

    def get_index(self, prompt_uri: str) -> int:
        return int(prompt_uri.split("-")[-1].split(".")[0])

    @override
    def execute(self, event: StoreResultsInput) -> None:
        findings = self.concat_results(event.llm_response)
        index = self.get_index(event.prompt_uri)
        s3_bucket, _ = s3.parse_s3_uri(event.prompt_uri)
        findings_data = self.retrieve_findings_data(event.assessment_id, index, s3_bucket)
        self.store_results(event.assessment_id, findings, findings_data)
