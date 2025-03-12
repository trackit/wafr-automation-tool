import json
import logging
from typing import override

from common.config import (
    ASSESSMENT_PK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    STORE_CHUNK_PATH,
)
from common.entities import AnswerData, ChunkId, FindingExtra, PillarDict, ScanningTool
from common.task import Task
from exceptions.assessment import InvalidPromptUriError
from services.database import IDatabaseService
from services.storage import IStorageService
from utils import s3
from utils.questions import QuestionSet

from state_machine.event import StoreResultsInput

logger = logging.getLogger("StoreResults")


class StoreResults(Task[StoreResultsInput, None]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        question_set: QuestionSet,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.questions = question_set.data

    def retrieve_findings_data(
        self,
        assessment_id: str,
        s3_bucket: str,
        chunk_path: str,
    ) -> list[FindingExtra]:
        key = STORE_CHUNK_PATH.format(assessment_id, chunk_path)
        chunk_content = self.storage_service.get(Bucket=s3_bucket, Key=key)
        return [FindingExtra(**item) for item in json.loads(chunk_content)]

    def verify_answer_data(self, answer_data: AnswerData) -> bool:
        return (
            answer_data.pillar in self.questions
            and answer_data.question in self.questions[answer_data.pillar]
            and answer_data.best_practice in self.questions[answer_data.pillar][answer_data.question]
        )

    def associate_finding_ids(
        self,
        assessment_id: str,
        scanning_tool: ScanningTool,
        answer_data: AnswerData,
        bp_finding_ids: list[str],
    ) -> None:
        if not bp_finding_ids:
            return
        if not self.verify_answer_data(answer_data):
            logger.error(
                "Data not found for pillar: %s, question: %s, best practice: %s",
                answer_data.pillar,
                answer_data.question,
                answer_data.best_practice,
            )
            return
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            UpdateExpression="SET findings.#pillar.#question.#best_practice = list_append(if_not_exists(findings.#pillar.#question.#best_practice, :empty_list), :new_findings)",  # noqa: E501
            ExpressionAttributeNames={
                "#pillar": answer_data.pillar,
                "#question": answer_data.question,
                "#best_practice": answer_data.best_practice,
            },
            ExpressionAttributeValues={
                ":new_findings": [f"{scanning_tool}:{finding_id}" for finding_id in bp_finding_ids],
                ":empty_list": [],
            },
        )

    def store_findings_in_db(
        self,
        assessment_id: str,
        scanning_tool: ScanningTool,
        finding_ids: list[str],
        findings_data: list[FindingExtra],
    ) -> None:
        for finding_id in finding_ids:
            finding_data = next(
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
                    DDB_SORT_KEY: f"{scanning_tool}:{finding_id}",
                },
            )

    def store_results(
        self,
        assessment_id: str,
        scanning_tool: ScanningTool,
        llm_findings: dict[str, PillarDict],
        findings_data: list[FindingExtra],
    ) -> None:
        for pillar, pillar_data in llm_findings.items():
            for question, question_data in pillar_data.items():
                for best_practice in question_data:
                    finding_ids: list[str] = [
                        str(finding_id) for finding_id in llm_findings[pillar][question][best_practice]
                    ]
                    answer_data = AnswerData(pillar=pillar, question=question, best_practice=best_practice)
                    self.associate_finding_ids(assessment_id, scanning_tool, answer_data, finding_ids)
                    self.store_findings_in_db(assessment_id, scanning_tool, finding_ids, findings_data)

    def ensure_text_format(self, llm_response: str) -> str:
        return llm_response.replace("\n", "")

    def merge_response(self, llm_response: str) -> dict[str, PillarDict]:
        json_body = json.loads(llm_response)
        contents = json_body["content"]
        findings: dict[str, PillarDict] = {}
        for content in contents:
            llm_result = self.ensure_text_format(content["text"])
            try:
                obj = json.loads(llm_result)
                findings.update(obj)
            except json.JSONDecodeError:
                continue
        return findings

    def get_uri_infos(self, prompt_uri: str) -> tuple[ScanningTool, ChunkId]:
        split = prompt_uri.split("/")
        if len(split) < 1:
            raise InvalidPromptUriError(prompt_uri)
        filename = split[-1]
        without_extension = filename.split(".")[0]
        split = without_extension.split("_")
        scanning_tool = ScanningTool(split[0])
        chunk_id = split[1]
        return scanning_tool, chunk_id

    @override
    def execute(self, event: StoreResultsInput) -> None:
        llm_findings = self.merge_response(event.llm_response)
        s3_bucket, s3_key = s3.parse_s3_uri(event.prompt_uri)
        scanning_tool, chunk_id = self.get_uri_infos(s3_key)
        findings_data = self.retrieve_findings_data(event.assessment_id, s3_bucket, f"{scanning_tool}_{chunk_id}")
        self.store_results(event.assessment_id, scanning_tool, llm_findings, findings_data)
