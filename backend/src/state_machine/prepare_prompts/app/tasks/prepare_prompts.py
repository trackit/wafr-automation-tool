import json
from typing import Any, override

from common.config import (
    ASSESSMENT_PK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    QUESTION_SET_DATA_PLACEHOLDER,
    S3_BUCKET,
    SCANNING_TOOL_DATA_PLACEHOLDER,
    SCANNING_TOOL_TITLE_PLACEHOLDER,
    STORE_CHUNK_PATH,
    STORE_PROMPT_PATH,
)
from common.entities import Finding, FindingExtra, Prompt, PromptS3Uri
from common.task import Task
from exceptions.scanning_tool import InvalidScanningToolError
from services.database import IDatabaseService
from services.scanning_tools import IScanningToolService
from services.scanning_tools.list import SCANNING_TOOL_SERVICES
from services.storage import IStorageService
from utils.prompt import get_prompt
from utils.questions import QuestionSet
from utils.s3 import get_s3_uri

from state_machine.event import PreparePromptsInput

CHUNK_SIZE = 3000


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        question_set: QuestionSet,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.question_set = question_set

    def populate_dynamodb(self, assessment_id: str) -> None:
        attrs: dict[str, Any] = {"findings": self.question_set.data, "question_version": self.question_set.version}
        self.database_service.update_attrs(
            table_name=DDB_TABLE,
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            attrs=attrs,
        )

    def save_chunk_for_retrieve(
        self,
        scanning_tool_service: IScanningToolService,
        assessment_id: str,
        chunk_index: int,
        chunk: list[FindingExtra],
    ) -> None:
        key = STORE_CHUNK_PATH.format(assessment_id, f"{scanning_tool_service.name}_{chunk_index}")
        self.storage_service.put(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps([finding.model_dump(exclude_none=True) for finding in chunk]),
        )

    def create_chunks(
        self,
        scanning_tool_service: IScanningToolService,
        assessment_id: str,
        findings: list[FindingExtra],
    ) -> list[list[Finding]]:
        initial_chunks = [findings[i : i + CHUNK_SIZE] for i in range(0, len(findings), CHUNK_SIZE)]
        chunks: list[list[Finding]] = []
        for i, chunk in enumerate(initial_chunks):
            self.save_chunk_for_retrieve(scanning_tool_service, assessment_id, i, chunk)
            chunks.append([Finding(**finding.model_dump(exclude_none=True)) for finding in chunk])
        return chunks

    def create_prompts_from_chunks(
        self,
        scanning_tool_service: IScanningToolService,
        prompt: str,
        chunks: list[list[Finding]],
    ) -> list[Prompt]:
        prompt = prompt.replace(SCANNING_TOOL_TITLE_PLACEHOLDER, scanning_tool_service.title)
        prompts: list[Prompt] = []
        for chunk in chunks:
            chunk_prompt = prompt
            chunk_prompt = chunk_prompt.replace(
                SCANNING_TOOL_DATA_PLACEHOLDER,
                json.dumps([finding.model_dump(exclude_none=True) for finding in chunk], separators=(",", ":")),
            )
            prompts.append(chunk_prompt)
        return prompts

    def insert_questions_in_prompt(self, prompt: Prompt) -> str:
        return prompt.replace(
            QUESTION_SET_DATA_PLACEHOLDER,
            json.dumps(self.question_set.data, separators=(",", ":")).replace(":{}", ""),
        )

    def store_prompts(
        self,
        scanning_tool_service: IScanningToolService,
        assessment_id: str,
        prompts: list[Prompt],
    ) -> list[PromptS3Uri]:
        prompt_uris: list[PromptS3Uri] = []
        for i, prompt in enumerate(prompts):
            key = STORE_PROMPT_PATH.format(assessment_id, f"{scanning_tool_service.name}_{i}")
            prompt_uris.append(get_s3_uri(S3_BUCKET, key))
            prompt_with_questions = self.insert_questions_in_prompt(prompt)
            self.storage_service.put(
                Bucket=S3_BUCKET,
                Key=key,
                Body=prompt_with_questions,
            )
        return prompt_uris

    def create_prompts(self, scanning_tool_service: IScanningToolService, assessment_id: str) -> list[Prompt]:
        findings = scanning_tool_service.retrieve_findings(assessment_id)
        chunks = self.create_chunks(scanning_tool_service, assessment_id, findings)
        prompts = self.create_prompts_from_chunks(scanning_tool_service, get_prompt(), chunks)
        return self.store_prompts(scanning_tool_service, assessment_id, prompts)

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        scanning_tool_service_type = SCANNING_TOOL_SERVICES.get(event.scanning_tool)
        if scanning_tool_service_type is None:
            raise InvalidScanningToolError(event.scanning_tool)

        self.populate_dynamodb(event.assessment_id)
        scanning_tool_service = scanning_tool_service_type(self.storage_service)
        return self.create_prompts(scanning_tool_service, event.assessment_id)
