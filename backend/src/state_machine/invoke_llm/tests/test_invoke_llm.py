from unittest.mock import MagicMock, patch

from tests.__mocks__.fake_ai_service import FakeAIService
from tests.__mocks__.fake_model import FakeModel
from tests.__mocks__.fake_storage_service import FakeStorageService

from state_machine.event import InvokeLLMInput

fake_model = FakeModel()


@patch("common.config.AI_MODELS", {"fake-model": fake_model})
@patch("common.config.AI_MODEL", "fake-model")
def test_invoke_llm():
    from ..app.tasks.invoke_llm import InvokeLLM

    fake_storage_service = FakeStorageService()
    fake_ai_service = FakeAIService()

    fake_storage_service.get = MagicMock(return_value="prompt")
    fake_ai_service.converse = MagicMock(return_value="result")

    invoke_llm_input = InvokeLLMInput(assessment_id="AID", prompt_uri="s3://bucket/key")
    task = InvokeLLM(storage_service=fake_storage_service, ai_service=fake_ai_service)
    result = task.execute(invoke_llm_input)

    fake_storage_service.get.assert_called_once_with(Bucket="bucket", Key="key")
    fake_ai_service.converse.assert_called_once_with(fake_model, "prompt")
    assert result == "result"
