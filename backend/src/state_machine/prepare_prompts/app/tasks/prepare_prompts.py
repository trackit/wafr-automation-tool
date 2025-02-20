import json
import os
from datetime import datetime
from typing import Any, override

from common.event import FormatProwlerInput, PreparePromptsInput
from common.task import Task
from tasks.format_prowler import FormatProwler
from types_boto3_s3 import S3Client

PROMPT_PATH = "./prompt.txt"
SCRIPTS_PATH = "./scripts"


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        s3_client: S3Client,
        s3_bucket: str,
    ):
        super().__init__()
        self.s3_client = s3_client
        self.s3_bucket = s3_bucket
        self.format_prowler_task = FormatProwler(self.s3_client)

    def retrieve_prowler_prompt(self) -> str:
        with open(PROMPT_PATH, "r") as f:
            prompt = f.read()
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
                        questions[p][q][bp] = {}
        prompt = prompt.replace(
            "[WAFRJSON]",
            json.dumps(questions, separators=(",", ":")).replace(":{}", ""),
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
        prowler_output_uri = f"s3://{self.s3_bucket}/scan/prowler/json-ocsf/prowler-output-{event.account_id}.ocsf.json"
        prowler_output_chunks = self.format_prowler_task.execute(
            FormatProwlerInput(prowler_output=prowler_output_uri)
        )
        prompt = self.retrieve_prowler_prompt()
        return self.create_prowler_prompt_from_chunks(prompt, prowler_output_chunks)

    def store_prompts(self, s3_bucket: str, prompts: list[str]) -> list[str]:
        prompts_uri: list[str] = []
        for i, prompt in enumerate(prompts):
            prompts_uri.append(f"s3://{s3_bucket}/prompts/prompt-{i}.txt")
            self.s3_client.put_object(
                Bucket=s3_bucket,
                Key=f"prompts/prompt-{i}.txt",
                Body=prompt,
            )
        return prompts_uri

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        prompts: list[str] = []
        prompts.extend(self.create_prowler_prompt(event))
        return self.store_prompts(self.s3_bucket, prompts)
