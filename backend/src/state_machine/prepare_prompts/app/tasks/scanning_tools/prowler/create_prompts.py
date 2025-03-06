import json
import logging
from pathlib import Path
from typing import TypeVar, override

from common.config import (
    PROWLER_JSON_PLACEHOLDER,
    PROWLER_OCSF_PATH,
    PROWLER_PROMPT_PATH,
    S3_BUCKET,
    STORE_CHUNK_PATH,
    STORE_PROMPT_PATH,
    WAFR_JSON_PLACEHOLDER,
)
from common.entities import Finding, FindingExtra, Prompt, PromptS3Uri
from common.task import CreatePromptsTask
from services.storage import IStorageService
from utils.questions import QuestionSet
from utils.s3 import get_s3_uri

from state_machine.event import CreatePromptsInput

logger = logging.getLogger("CreateProwlerPrompts")
logger.setLevel(logging.DEBUG)

CHUNK_SIZE = 400

FORMAT_TYPE = TypeVar("FORMAT_TYPE", bound=Finding)


class CreateProwlerPrompts(CreatePromptsTask):
    def __init__(self, storage_service: IStorageService, question_set: QuestionSet) -> None:
        super().__init__(storage_service, question_set)

    def retrieve_output(self, assessment_id: str) -> list[FindingExtra]:
        key = PROWLER_OCSF_PATH.format(assessment_id)
        content = self.storage_service.get(Bucket=S3_BUCKET, Key=key)
        loaded_content = json.loads(content)
        return [FindingExtra(**item, id=str(i + 1)) for i, item in enumerate(loaded_content)]

    def save_chunk_for_retrieve(
        self,
        assessment_id: str,
        chunk_id: int,
        chunk: list[FindingExtra],
    ) -> None:
        key = STORE_CHUNK_PATH.format(assessment_id, chunk_id)
        self.storage_service.put(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps([finding.model_dump(exclude_none=True) for finding in chunk]),
        )

    def create_chunks(
        self,
        assessment_id: str,
        findings: list[FindingExtra],
    ) -> list[list[Finding]]:
        initial_chunks = [findings[i : i + CHUNK_SIZE] for i in range(0, len(findings), CHUNK_SIZE)]
        chunks: list[list[Finding]] = []
        for i, chunk in enumerate(initial_chunks):
            self.save_chunk_for_retrieve(assessment_id, i, chunk)
            chunks.append([Finding(**finding.model_dump(exclude_none=True)) for finding in chunk])
        return chunks

    def create_prompts_from_chunks(
        self,
        prompt: str,
        chunks: list[list[Finding]],
    ) -> list[Prompt]:
        prompts: list[Prompt] = []
        for chunk in chunks:
            chunk_prompt = prompt
            chunk_prompt = chunk_prompt.replace(
                PROWLER_JSON_PLACEHOLDER,
                json.dumps([finding.model_dump(exclude_none=True) for finding in chunk], separators=(",", ":")),
            )
            prompts.append(chunk_prompt)
        return prompts

    def retrieve_prompt(self) -> str:
        with Path(PROWLER_PROMPT_PATH).open() as f:
            return f.read()

    def insert_questions_in_prompt(self, prompt: Prompt) -> str:
        return prompt.replace(
            WAFR_JSON_PLACEHOLDER,
            json.dumps(self.question_set.data, separators=(",", ":")).replace(":{}", ""),
        )

    def store_prompts(
        self,
        assessment_id: str,
        s3_bucket: str,
        prompts: list[Prompt],
    ) -> list[PromptS3Uri]:
        prompt_uris: list[PromptS3Uri] = []
        for i, prompt in enumerate(prompts):
            key = STORE_PROMPT_PATH.format(assessment_id, i)
            prompt_uris.append(get_s3_uri(s3_bucket, key))
            prompt_with_questions = self.insert_questions_in_prompt(prompt)
            self.storage_service.put(
                Bucket=s3_bucket,
                Key=key,
                Body=prompt_with_questions,
            )
        return prompt_uris

    @override
    def execute(self, event: CreatePromptsInput) -> list[PromptS3Uri]:
        prowler_output = self.retrieve_output(event.assessment_id)
        chunks = self.create_chunks(event.assessment_id, prowler_output)
        prompts = self.create_prompts_from_chunks(self.retrieve_prompt(), chunks)
        return self.store_prompts(event.assessment_id, S3_BUCKET, prompts)
