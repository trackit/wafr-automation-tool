from unittest.mock import MagicMock

import pytest
from entities.ai import PromptVariables
from entities.finding import Finding
from services.ai import BedrockService
from types_boto3_bedrock_runtime import BedrockRuntimeClient


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


def test_bedrock_service_converse(bedrock_service: BedrockService):
    response = bedrock_service.converse(
        prompt_arn="ARN",
        prompt_variables=PromptVariables(
            question_set_data="QUESTIONS",
            scanning_tool_data=[
                Finding(
                    id="AID",
                    status_code="FAIL",
                    status_detail="error",
                )
            ],
            scanning_tool_title="test",
        ),
    )
    assert response == "Hello world!"
