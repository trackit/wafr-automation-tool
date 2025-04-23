import json
import logging
from abc import ABC, abstractmethod
from typing import override

from entities.ai import PromptVariables
from types_boto3_bedrock_runtime import BedrockRuntimeClient

logger = logging.getLogger("AIService")
logger.setLevel(logging.DEBUG)


class IAIService(ABC):
    @abstractmethod
    def converse(self, prompt_arn: str, prompt_variables: PromptVariables) -> str:
        raise NotImplementedError


class BedrockService(IAIService):
    def __init__(self, bedrock_client: BedrockRuntimeClient) -> None:
        super().__init__()
        self.bedrock_client = bedrock_client

    @override
    def converse(self, prompt_arn: str, prompt_variables: PromptVariables) -> str:
        response = self.bedrock_client.converse_stream(
            modelId=prompt_arn,
            promptVariables={
                k: {"text": json.dumps(v, separators=(",", ":"))} for k, v in prompt_variables.model_dump().items()
            },
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
