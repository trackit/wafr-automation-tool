import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import override

from common.config import (
    PROMPT_PATH,
    QUESTION_SET_DATA_PLACEHOLDER,
    S3_BUCKET,
    SCANNING_TOOL_DATA_PLACEHOLDER,
    SCANNING_TOOL_NAME_PLACEHOLDER,
    STORE_CHUNK_PATH,
    STORE_PROMPT_PATH,
)
from common.entities import Finding, FindingExtra, Prompt, PromptS3Uri
from utils.questions import QuestionSet
from utils.s3 import get_s3_uri

from services.scanning_tools import IScanningToolService
from services.storage import IStorageService

CHUNK_SIZE = 1000


class IPromptService(ABC):
    @abstractmethod
    def create_prompts(self, scanning_tool_service: IScanningToolService, assessment_id: str) -> list[Prompt]:
        pass


class PromptService(IPromptService):
    def __init__(self, storage_service: IStorageService, question_set: QuestionSet) -> None:
        super().__init__()
        self.storage_service = storage_service
        self.question_set = question_set

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
        prompt = prompt.replace(SCANNING_TOOL_NAME_PLACEHOLDER, scanning_tool_service.name)
        prompts: list[Prompt] = []
        for chunk in chunks:
            chunk_prompt = prompt
            chunk_prompt = chunk_prompt.replace(
                SCANNING_TOOL_DATA_PLACEHOLDER,
                json.dumps([finding.model_dump(exclude_none=True) for finding in chunk], separators=(",", ":")),
            )
            prompts.append(chunk_prompt)
        return prompts

    def retrieve_prompt(self) -> str:
        with Path(PROMPT_PATH).open() as f:
            return f.read()

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

    @override
    def create_prompts(self, scanning_tool_service: IScanningToolService, assessment_id: str) -> list[Prompt]:
        findings = scanning_tool_service.retrieve_findings(assessment_id)
        chunks = self.create_chunks(scanning_tool_service, assessment_id, findings)
        prompts = self.create_prompts_from_chunks(scanning_tool_service, self.retrieve_prompt(), chunks)
        return self.store_prompts(scanning_tool_service, assessment_id, prompts)
