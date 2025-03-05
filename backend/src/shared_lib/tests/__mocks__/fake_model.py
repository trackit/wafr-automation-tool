from typing import override

from common.models import IModel
from types_boto3_bedrock_runtime.type_defs import InvokeModelRequestTypeDef


class FakeModel(IModel):
    @override
    def build(self, prompt: str) -> InvokeModelRequestTypeDef:
        raise NotImplementedError
