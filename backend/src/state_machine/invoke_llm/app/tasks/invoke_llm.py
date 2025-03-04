from typing import override

from common.models import IModel
from common.task import Task
from services.ai import IAIService
from services.storage import IStorageService
from state_machine.event import InvokeLLMInput
from utils.s3 import parse_s3_uri


class InvokeLLM(Task[InvokeLLMInput, str]):
    def __init__(
        self,
        storage_service: IStorageService,
        ai_service: IAIService,
        model: IModel,
    ):
        super().__init__()
        self.storage_service = storage_service
        self.ai_service = ai_service
        self.model = model

    def retrieve_prompt(self, prompt_uri: str) -> str:
        s3_bucket, s3_key = parse_s3_uri(prompt_uri)
        return self.storage_service.get(Bucket=s3_bucket, Key=s3_key)

    @override
    def execute(self, event: InvokeLLMInput) -> str:
        prompt = self.retrieve_prompt(event.prompt_uri)
        return self.ai_service.invoke_model(
            self.model,
            prompt,
        )
