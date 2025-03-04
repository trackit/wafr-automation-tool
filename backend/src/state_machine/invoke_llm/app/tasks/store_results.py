import json
from typing import Any, override

from common.config import (
    DDB_ASSESSMENT_SK,
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

from state_machine.event import StoreResultsInput


class StoreResults(Task[StoreResultsInput, None]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service

    def retrieve_findings_data(
        self,
        assessment_id: str,
        chunk_id: int,
        s3_bucket: str,
    ) -> list[FindingExtra]:
        key = STORE_CHUNK_PATH.format(assessment_id, chunk_id)
        chunk_content = self.storage_service.get(Bucket=s3_bucket, Key=key)
        return [FindingExtra(**item) for item in json.loads(chunk_content)]

    def store_findings_id(
        self,
        assessment_id: str,
        pillar_name: str,
        question_name: str,
        bp_name: str,
        bp_findings: list[str],
    ) -> None:
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: assessment_id, DDB_SORT_KEY: DDB_ASSESSMENT_SK},
            UpdateExpression="SET findings.#pillar.#question.#bp = list_append(if_not_exists(findings.#pillar.#question.#bp, :empty_list), :new_findings)",
            ExpressionAttributeNames={
                "#pillar": pillar_name,
                "#question": question_name,
                "#bp": bp_name,
            },
            ExpressionAttributeValues={
                ":new_findings": bp_findings,
                ":empty_list": [],
            },
        )

    def store_findings(
        self,
        assessment_id: str,
        bp_findings: list[str],
        findings_data: list[FindingExtra],
    ) -> None:
        for finding in bp_findings:
            finding_data: FindingExtra | None = next(
                (item for item in findings_data if item.id == finding),
                None,
            )
            if finding_data is None:
                raise ValueError(f"Finding data not found for id: {finding}")
            self.database_service.put(
                table_name=DDB_TABLE,
                item={
                    **finding_data.dict(),
                    DDB_KEY: assessment_id,
                    DDB_SORT_KEY: finding,
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
                    bp_findings: list[str] = findings[pillar_name][question_name][bp_name]
                    self.store_findings_id(
                        assessment_id,
                        pillar_name,
                        question_name,
                        bp_name,
                        bp_findings,
                    )
                    self.store_findings(assessment_id, bp_findings, findings_data)

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
