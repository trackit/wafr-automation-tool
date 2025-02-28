import json
import os
from datetime import datetime
from typing import Any, override

from common.task import Task
from state_machine.config import (
    DDB_TABLE,
    PROMPT_PATH,
    PROWLER_OCSF_PATH,
    S3_BUCKET,
    SCRIPTS_PATH,
    STORE_PROMPT_PATH,
)
from state_machine.event import FormatProwlerInput, PreparePromptsInput
from tasks.format_prowler import FormatProwler
from types_boto3_dynamodb import DynamoDBServiceResource
from types_boto3_s3 import S3Client
from utils.s3 import get_s3_uri


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        s3_client: S3Client,
        dynamodb_client: DynamoDBServiceResource,
    ):
        super().__init__()
        self.s3_client = s3_client
        self.s3_bucket = S3_BUCKET
        self.dynamodb_table = dynamodb_client.Table(DDB_TABLE)
        self.format_prowler_task = FormatProwler(self.s3_client)
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
        with open(f"{SCRIPTS_PATH}/{question_set[-1]}", "r") as f:
            questions = json.load(f)
            for p, pillar in questions.items():
                for q, question in pillar.items():
                    for bp, _ in question.items():
                        questions[p][q][bp] = []
        return questions

    def populate_dynamodb(self, id: str) -> None:
        self.dynamodb_table.update_item(
            Key={"id": id, "finding_id": "0"},
            UpdateExpression="SET #findings = :findings",
            ExpressionAttributeNames={"#findings": "findings"},
            ExpressionAttributeValues={":findings": self.questions},
        )

    def retrieve_prowler_prompt(self) -> str:
        with open(PROMPT_PATH, "r") as f:
            prompt = f.read()
        prompt = prompt.replace(
            "[WAFRJSON]",
            json.dumps(self.questions, separators=(",", ":")).replace(":{}", ""),
        )
        return prompt

    def create_prowler_prompt_from_chunks(
        self, prompt: str, chunks: list[list[dict[str, Any]]]
    ) -> list[str]:
        prompts: list[str] = []
        for chunk in chunks:
            chunk_prompt = prompt
            chunk_prompt = chunk_prompt.replace(
                "[ProwlerJSON]", json.dumps(chunk, separators=(",", ":"))
            )
            prompts.append(chunk_prompt)
        return prompts

    def create_prowler_prompt(self, event: PreparePromptsInput) -> list[str]:
        key = PROWLER_OCSF_PATH.format(event.id)
        prowler_output_uri = get_s3_uri(self.s3_bucket, key)
        prowler_output_chunks = self.format_prowler_task.execute(
            FormatProwlerInput(prowler_output=prowler_output_uri, id=event.id)
        )
        prompt = self.retrieve_prowler_prompt()
        return self.create_prowler_prompt_from_chunks(prompt, prowler_output_chunks)

    def store_prompts(self, s3_bucket: str, prompts: list[str], id: str) -> list[str]:
        prompts_uri: list[str] = []
        for i, prompt in enumerate(prompts):
            key = STORE_PROMPT_PATH.format(id, i)
            prompts_uri.append(get_s3_uri(s3_bucket, key))
            self.s3_client.put_object(
                Bucket=s3_bucket,
                Key=key,
                Body=prompt,
            )
        return prompts_uri

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        prompts: list[str] = []
        self.populate_dynamodb(event.id)
        prompts.extend(self.create_prowler_prompt(event))
        return self.store_prompts(self.s3_bucket, prompts, event.id)
