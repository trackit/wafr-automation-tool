import json
from typing import Any, override

from common.config import (
    PROWLER_JSON_PLACEHOLDER,
    PROWLER_OCSF_PATH,
    PROWLER_PROMPT_PATH,
    S3_BUCKET,
)
from common.task import Task
from services.storage import IStorageService
from state_machine.event import CreateProwlerPromptInput, FormatProwlerInput
from tasks.prowler.format_prowler import FormatProwler


class CreateProwlerPrompt(Task[CreateProwlerPromptInput, list[str]]):
    def __init__(
        self,
        storage_service: IStorageService,
    ):
        super().__init__()
        self.storage_service = storage_service
        self.format_prowler_task = FormatProwler(storage_service)

    def add_findings_id(self, content: list[dict[str, Any]]) -> list[dict[str, Any]]:
        for i, item in enumerate(content):
            item["id"] = i + 1
        return content

    def retrieve_prowler_output(self, id: str) -> list[dict[str, Any]]:
        key = PROWLER_OCSF_PATH.format(id)
        content = self.storage_service.get(Bucket=S3_BUCKET, Key=key)
        return self.add_findings_id(json.loads(content))

    def create_prowler_prompt_from_chunks(
        self, prompt: str, chunks: list[list[dict[str, Any]]]
    ) -> list[str]:
        prompts: list[str] = []
        for chunk in chunks:
            chunk_prompt = prompt
            chunk_prompt = chunk_prompt.replace(
                PROWLER_JSON_PLACEHOLDER, json.dumps(chunk, separators=(",", ":"))
            )
            prompts.append(chunk_prompt)
        return prompts

    def retrieve_prowler_prompt(self) -> str:
        with open(PROWLER_PROMPT_PATH, "r") as f:
            return f.read()

    @override
    def execute(self, event: CreateProwlerPromptInput) -> list[str]:
        prowler_output = self.retrieve_prowler_output(event.id)
        prowler_output_chunks = self.format_prowler_task.execute(
            FormatProwlerInput(prowler_output=prowler_output, id=event.id)
        )
        prompt = self.retrieve_prowler_prompt()
        return self.create_prowler_prompt_from_chunks(prompt, prowler_output_chunks)
