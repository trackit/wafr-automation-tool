import datetime
import json
import os
from pathlib import Path
from typing import Any, override

from common.config import (
    DDB_ASSESSMENT_SK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    S3_BUCKET,
    SCRIPTS_PATH,
    STORE_PROMPT_PATH,
    WAFR_JSON_PLACEHOLDER,
)
from common.task import Task
from services.database import IDatabaseService
from services.storage import IStorageService
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
        self.questions = self.retrieve_questions()

    def retrieve_questions(self) -> dict[str, Any]:
        question_set = [f for f in os.listdir(SCRIPTS_PATH) if f.endswith(".json") and f.startswith("questions")]
        question_set.sort(
            key=lambda x: datetime.datetime.strptime(
                x.split("_")[1].split(".")[0],
                "%m%d%Y",
            ).astimezone(datetime.UTC),
        )
        self.question_version = question_set[-1].split(".")[0]
        with Path(f"{SCRIPTS_PATH}/{question_set[-1]}").open() as f:
            questions = json.load(f)
            for p, pillar in questions.items():
                for q, question in pillar.items():
                    for bp in question:
                        questions[p][q][bp] = []
        return questions

    def populate_dynamodb(self, assessment_id: str) -> None:
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: assessment_id, DDB_SORT_KEY: DDB_ASSESSMENT_SK},
            UpdateExpression="SET findings = :findings, question_version = :question_version",
            ExpressionAttributeValues={
                ":findings": self.questions,
                ":question_version": self.question_version,
            },
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
            self.insert_questions(prompt)
            self.storage_service.put(
                Bucket=s3_bucket,
                Key=key,
                Body=prompt,
            )
        return prompts_uri

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        prompts: list[str] = []
        self.populate_dynamodb(event.assessment_id)
        prompts.extend(event.prowler_prompts)
        return self.store_prompts(event.assessment_id, S3_BUCKET, prompts)
