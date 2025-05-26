import json
from unittest.mock import MagicMock

from entities.ai import PromptVariables
from entities.finding import Finding
from tests.__mocks__.fake_ai_service import FakeAIService
from tests.__mocks__.fake_storage_service import FakeStorageService

from state_machine.event import InvokeLLMInput


def test_invoke_llm():
    from ..app.tasks.invoke_llm import InvokeLLM

    fake_storage_service = FakeStorageService()
    fake_ai_service = FakeAIService()

    prompt_variables = PromptVariables(
        question_set_data="QUESTIONS",
        scanning_tool_data=[
            Finding(
                id="AID",
                status_detail="error",
                risk_details="risk",
            )
        ],
        scanning_tool_title="test",
    )
    fake_storage_service.get = MagicMock(return_value=json.dumps(prompt_variables.model_dump()))
    fake_ai_service.converse = MagicMock(return_value="result")

    invoke_llm_input = InvokeLLMInput(assessment_id="AID", prompt_arn="ARN", prompt_uri="s3://bucket/key")
    task = InvokeLLM(storage_service=fake_storage_service, ai_service=fake_ai_service)
    result = task.execute(invoke_llm_input)

    fake_storage_service.get.assert_called_once_with(Bucket="bucket", Key="key")
    fake_ai_service.converse.assert_called_once_with("ARN", prompt_variables)
    assert result == "result"
