import io
from unittest.mock import MagicMock

import pytest
from botocore.response import StreamingBody
from services.ai import BedrockService
from types_boto3_bedrock_runtime import BedrockRuntimeClient

from tests.__mocks__.fake_model import FakeModel


@pytest.fixture
def bedrock_runtime_client():
    bedrock_runtime_client = MagicMock()
    body = "Hello world!"
    streaming_body = StreamingBody(io.BytesIO(body.encode()), len(body))
    bedrock_runtime_client.invoke_model = MagicMock(return_value={"body": streaming_body})
    return bedrock_runtime_client


@pytest.fixture
def bedrock_service(bedrock_runtime_client: BedrockRuntimeClient):
    return BedrockService(bedrock_runtime_client)


@pytest.fixture
def fake_model():
    fake_model = FakeModel()
    fake_model.build = MagicMock(return_value={"prompt": "test-prompt"})
    return fake_model


def test_bedrock_service_invoke(bedrock_service: BedrockService, fake_model: FakeModel):
    response = bedrock_service.invoke_model(model=fake_model, prompt="test-prompt")
    assert response == "Hello world!"
