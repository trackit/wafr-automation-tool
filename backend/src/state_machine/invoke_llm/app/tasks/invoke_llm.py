import json
from typing import override

from common.task import Task
from entities.ai import PromptS3Uri, PromptVariables
from services.ai import IAIService
from services.storage import IStorageService
from utils.s3 import parse_s3_uri

from state_machine.event import InvokeLLMInput


class InvokeLLM(Task[InvokeLLMInput, str]):
    def __init__(
        self,
        storage_service: IStorageService,
        ai_service: IAIService,
    ) -> None:
        super().__init__()
        self.storage_service = storage_service
        self.ai_service = ai_service

    def retrieve_prompt_variables(self, prompt_uri: PromptS3Uri) -> PromptVariables:
        s3_bucket, s3_key = parse_s3_uri(prompt_uri)
        return PromptVariables(**json.loads(self.storage_service.get(Bucket=s3_bucket, Key=s3_key)))

    @override
    def execute(self, event: InvokeLLMInput) -> str:
        prompt_variables = self.retrieve_prompt_variables(event.prompt_uri)
        return self.ai_service.converse(
            event.prompt_arn,
            prompt_variables,
        )
