from unittest.mock import MagicMock, patch

from tests.__mocks__.fake_ai_service import FakeAIService
from tests.__mocks__.fake_model import FakeModel
from tests.__mocks__.fake_storage_service import FakeStorageService

from state_machine.event import InvokeLLMInput


@patch("common.config.AI_MODELS", {"fake-model": FakeModel})
@patch("common.config.AI_MODEL", "fake-model")
def test_invoke_llm():
    from ..app.tasks.invoke_llm import InvokeLLM

    fake_storage_service = FakeStorageService()
    fake_ai_service = FakeAIService()

    fake_storage_service.get = MagicMock(return_value="prompt")
    fake_ai_service.invoke_model = MagicMock(return_value="result")

    invoke_llm_input = InvokeLLMInput(assessment_id="AID", prompt_uri="s3://bucket/key")
    task = InvokeLLM(storage_service=fake_storage_service, ai_service=fake_ai_service)
    result = task.execute(invoke_llm_input)

    fake_storage_service.get.assert_called_once_with(Bucket="bucket", Key="key")
    fake_ai_service.invoke_model.assert_called_once()
    assert isinstance(fake_ai_service.invoke_model.call_args[0][0], FakeModel)
    assert fake_ai_service.invoke_model.call_args[0][1] == "prompt"
    assert result == "result"
