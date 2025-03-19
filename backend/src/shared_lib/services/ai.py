import logging
from abc import ABC, abstractmethod
from typing import override

from common.models import IModel
from types_boto3_bedrock_runtime import BedrockRuntimeClient

logger = logging.getLogger("AIService")
logger.setLevel(logging.DEBUG)


class IAIService(ABC):
    @abstractmethod
    def converse(self, model: IModel, prompt: str) -> str:
        raise NotImplementedError


class BedrockService(IAIService):
    def __init__(self, bedrock_client: BedrockRuntimeClient) -> None:
        super().__init__()
        self.bedrock_client = bedrock_client

    @override
    def converse(self, model: IModel, prompt: str) -> str:
        response = self.bedrock_client.converse_stream(
            modelId=model.id,
            inferenceConfig={
                "maxTokens": model.max_tokens,
                "temperature": model.temperature,
            },
            messages=[
                {"role": "user", "content": [{"text": prompt}]},
            ],
        )
        message = ""
        stream = response["stream"]
        for chunk in stream:
            if "contentBlockDelta" in chunk:
                delta_event = chunk["contentBlockDelta"]
                delta = delta_event["delta"]
                if "text" in delta:
                    message += delta["text"]
        return message
