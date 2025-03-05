import json
from typing import Any, override

from common.config import (
    ASSESSMENT_PK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    S3_BUCKET,
    STORE_PROMPT_PATH,
    WAFR_JSON_PLACEHOLDER,
)
from common.task import Task
from services.database import IDatabaseService
from services.storage import IStorageService
from utils.questions import retrieve_questions
from utils.s3 import get_s3_uri

from state_machine.event import PreparePromptsInput


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        questions_ouput = retrieve_questions()
        self.questions = questions_ouput.questions
        self.question_version = questions_ouput.question_version

    def populate_dynamodb(self, assessment_id: str) -> None:
        attrs: dict[str, Any] = {"findings": self.questions, "question_version": self.question_version}
        self.database_service.update_attrs(
            table_name=DDB_TABLE,
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            attrs=attrs,
        )

    def insert_questions(self, prompt: str) -> str:
        return prompt.replace(
            WAFR_JSON_PLACEHOLDER,
            json.dumps(self.questions, separators=(",", ":")).replace(":{}", ""),
        )

    def store_prompts(
        self,
        assessment_id: str,
        s3_bucket: str,
        prompts: list[str],
    ) -> list[str]:
        prompts_uri: list[str] = []
        for i, prompt in enumerate(prompts):
            key = STORE_PROMPT_PATH.format(assessment_id, i)
            prompts_uri.append(get_s3_uri(s3_bucket, key))
            prompt_with_questions = self.insert_questions(prompt)
            self.storage_service.put(
                Bucket=s3_bucket,
                Key=key,
                Body=prompt_with_questions,
            )
        return prompts_uri

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        prompts: list[str] = []
        self.populate_dynamodb(event.assessment_id)
        prompts.extend(event.prowler_prompts)
        return self.store_prompts(event.assessment_id, S3_BUCKET, prompts)
