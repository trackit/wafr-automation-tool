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
from common.task import Task
from entities.ai import AIFindingAssociation, ChunkId, PromptS3Uri
from entities.assessment import AssessmentID
from entities.best_practice import BestPracticeInfo
from entities.finding import FindingExtra, FindingID
from entities.scanning_tools import ScanningTool
from exceptions.ai import InvalidPromptResponseError
from exceptions.assessment import InvalidPromptUriError
from services.database import IDatabaseService
from services.storage import IStorageService
from utils import s3
from utils.questions import QuestionSet

from state_machine.event import StoreResultsInput

logger = logging.getLogger("StoreResults")
logger.setLevel(logging.DEBUG)


class StoreResults(Task[StoreResultsInput, None]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        formatted_question_set: QuestionSet,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.formatted_questions = formatted_question_set.data

    def retrieve_findings_data(
        self,
        assessment_id: AssessmentID,
        s3_bucket: str,
        chunk_path: str,
    ) -> list[FindingExtra]:
        key = STORE_CHUNK_PATH.format(assessment_id, chunk_path)
        chunk_content = self.storage_service.get(Bucket=s3_bucket, Key=key)
        return [FindingExtra(**item) for item in json.loads(chunk_content)]

    def store_finding_ids(
        self,
        assessment_id: AssessmentID,
        scanning_tool: ScanningTool,
        best_practice_info: BestPracticeInfo,
        best_practice_finding_ids: list[FindingID],
    ) -> None:
        if not best_practice_finding_ids:
            return
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            UpdateExpression="SET findings.#pillar.questions.#question.best_practices.#best_practice.results = list_append(if_not_exists(findings.#pillar.questions.#question.best_practices.#best_practice.results, :empty_list), :new_findings)",  # noqa: E501
            ExpressionAttributeNames={
                "#pillar": best_practice_info.pillar,
                "#question": best_practice_info.question,
                "#best_practice": best_practice_info.best_practice.get("id") or "",
            },
            ExpressionAttributeValues={
                ":new_findings": [f"{scanning_tool}:{finding_id}" for finding_id in best_practice_finding_ids],
                ":empty_list": [],
            },
        )

    def store_findings(
        self,
        assessment_id: AssessmentID,
        scanning_tool: ScanningTool,
        finding_ids: list[FindingID],
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

    def create_best_practices_info(self) -> dict[int, BestPracticeInfo]:
        best_practices: dict[int, BestPracticeInfo] = {}
        best_practice_id = 1
        for pillar_data in self.formatted_questions.values():
            for question_data in pillar_data.get("questions").values():
                for best_practice_data in question_data.get("best_practices").values():
                    best_practices[best_practice_id] = BestPracticeInfo(
                        id=best_practice_id,
                        pillar=pillar_data.get("id"),
                        question=question_data.get("id"),
                        best_practice={
                            "id": best_practice_data.get("id"),
                        },
                    )
                    best_practice_id += 1
        return best_practices

    def store_results(
        self,
        assessment_id: AssessmentID,
        scanning_tool: ScanningTool,
        ai_associations: list[AIFindingAssociation],
        findings_data: list[FindingExtra],
    ) -> None:
        best_practices_info = self.create_best_practices_info()
        for ai_association in ai_associations:
            best_practice_info = best_practices_info.get(ai_association["id"])
            if best_practice_info is None:
                logger.error("Best practice not found for id %d", ai_association["id"])
                continue
            finding_start = ai_association["start"]
            finding_end = ai_association["end"]
            finding_ids: list[FindingID] = [str(i) for i in range(finding_start, finding_end + 1)]
            self.store_finding_ids(assessment_id, scanning_tool, best_practice_info, finding_ids)
            self.store_findings(assessment_id, scanning_tool, finding_ids, findings_data)

    def load_response(self, llm_response: str) -> list[AIFindingAssociation]:
        try:
            findings = json.loads(llm_response)
        except json.JSONDecodeError as e:
            raise InvalidPromptResponseError(llm_response) from e
        return findings

    def get_uri_infos(self, prompt_uri: PromptS3Uri) -> tuple[ScanningTool, ChunkId]:
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
        ai_associations = self.load_response(event.llm_response)
        s3_bucket, s3_key = s3.parse_s3_uri(event.prompt_uri)
        scanning_tool, chunk_id = self.get_uri_infos(s3_key)
        findings_data = self.retrieve_findings_data(event.assessment_id, s3_bucket, f"{scanning_tool}_{chunk_id}")
        logger.info("Processing %s chunk %s", scanning_tool, chunk_id)
        self.store_results(event.assessment_id, scanning_tool, ai_associations, findings_data)
