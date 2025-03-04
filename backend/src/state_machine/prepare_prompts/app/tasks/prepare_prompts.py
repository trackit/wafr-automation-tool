import json
import os
from datetime import datetime
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
from state_machine.event import PreparePromptsInput
from utils.s3 import get_s3_uri


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
    ):
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.questions = self.retrieve_questions()

    def retrieve_questions(self) -> dict[str, Any]:
        question_set = [
            f
            for f in os.listdir(SCRIPTS_PATH)
            if f.endswith(".json") and f.startswith("questions")
        ]
        question_set.sort(
            key=lambda x: datetime.strptime(x.split("_")[1].split(".")[0], "%m%d%Y")
        )
        self.question_version = question_set[-1].split(".")[0]
        with open(f"{SCRIPTS_PATH}/{question_set[-1]}", "r") as f:
            questions = json.load(f)
            for p, pillar in questions.items():
                for q, question in pillar.items():
                    for bp, _ in question.items():
                        questions[p][q][bp] = []
        return questions

    def populate_dynamodb(self, id: str) -> None:
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: id, DDB_SORT_KEY: DDB_ASSESSMENT_SK},
            UpdateExpression="SET findings = :findings, question_version = :question_version",
            ExpressionAttributeValues={
                ":findings": self.questions,
                ":question_version": self.question_version,
            },
        )

    def insert_questions(self, prompt: str) -> str:
        prompt = prompt.replace(
            WAFR_JSON_PLACEHOLDER,
            json.dumps(self.questions, separators=(",", ":")).replace(":{}", ""),
        )
        return prompt

    def store_prompts(self, s3_bucket: str, prompts: list[str], id: str) -> list[str]:
        prompts_uri: list[str] = []
        for i, prompt in enumerate(prompts):
            key = STORE_PROMPT_PATH.format(id, i)
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
        self.populate_dynamodb(event.id)
        prompts.extend(event.prowler_prompts)
        return self.store_prompts(S3_BUCKET, prompts, event.id)
