from abc import ABC, abstractmethod
from typing import override

from common.models import IModel
from types_boto3_bedrock_runtime import BedrockRuntimeClient


class IAIService(ABC):
    @abstractmethod
    def invoke_model(self, model: IModel, prompt: str) -> str:
        raise NotImplementedError


class BedrockService(IAIService):
    def __init__(self, bedrock_client: BedrockRuntimeClient):
        self.bedrock_client = bedrock_client

    @override
    def invoke_model(self, model: IModel, prompt: str) -> str:
        invoke_request = model.build(prompt)
        response = self.bedrock_client.invoke_model(**invoke_request)
        return response["body"].read().decode("utf-8")
