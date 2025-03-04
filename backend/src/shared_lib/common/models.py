import json
from abc import ABC, abstractmethod
from typing import Any, override

from pydantic import BaseModel
from types_boto3_bedrock_runtime.type_defs import InvokeModelRequestTypeDef


class IModel(ABC):
    @abstractmethod
    def build(self, prompt: str) -> InvokeModelRequestTypeDef:
        raise NotImplementedError


class Claude3Dot5Sonnet(BaseModel, IModel):
    model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    prompt_format: str = "\\n\\nHuman:{}\\n\\nAssistant:"
    temperature: float = 0
    max_tokens: int = 4000

    @override
    def build(self, prompt: str) -> InvokeModelRequestTypeDef:
        formatted_prompt = self.prompt_format.format(prompt)
        body: dict[str, Any] = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": [{"role": "user", "content": formatted_prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
        return {
            "modelId": self.model_id,
            "body": json.dumps(body, separators=(",", ":")),
        }
