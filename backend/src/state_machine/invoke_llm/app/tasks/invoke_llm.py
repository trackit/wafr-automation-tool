from typing import override

from common.config import AI_MODEL, AI_MODELS
from common.task import Task
from exceptions.ai import InvalidAIModelError
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

    def retrieve_prompt(self, prompt_uri: str) -> str:
        s3_bucket, s3_key = parse_s3_uri(prompt_uri)
        return self.storage_service.get(Bucket=s3_bucket, Key=s3_key)

    @override
    def execute(self, event: InvokeLLMInput) -> str:
        model_type = AI_MODELS.get(AI_MODEL)
        if model_type is None:
            raise InvalidAIModelError(AI_MODEL)

        prompt = self.retrieve_prompt(event.prompt_uri)
        return self.ai_service.converse(
            model_type,
            prompt,
        )
