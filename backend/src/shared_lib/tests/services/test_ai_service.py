from unittest.mock import MagicMock

import pytest
from services.ai import BedrockService
from types_boto3_bedrock_runtime import BedrockRuntimeClient

from tests.__mocks__.fake_model import FakeModel


@pytest.fixture
def bedrock_runtime_client():
    bedrock_runtime_client = MagicMock()
    bedrock_runtime_client.converse_stream = MagicMock(
        return_value={
            "stream": [
                {"contentBlockDelta": {"delta": {"text": "Hello"}}},
                {"contentBlockDelta": {"delta": {"text": " world!"}}},
            ]
        }
    )
    return bedrock_runtime_client


@pytest.fixture
def bedrock_service(bedrock_runtime_client: BedrockRuntimeClient):
    return BedrockService(bedrock_runtime_client)


@pytest.fixture
def fake_model():
    return FakeModel()


def test_bedrock_service_invoke(bedrock_service: BedrockService, fake_model: FakeModel):
    response = bedrock_service.converse(model=fake_model, prompt="test-prompt")
    assert response == "Hello world!"
