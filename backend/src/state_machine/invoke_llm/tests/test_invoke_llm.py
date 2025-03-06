from unittest.mock import MagicMock

from tests.__mocks__.fake_ai_service import FakeAIService
from tests.__mocks__.fake_model import FakeModel
from tests.__mocks__.fake_storage_service import FakeStorageService

from state_machine.event import InvokeLLMInput

from ..app.tasks.invoke_llm import InvokeLLM


def test_invoke_llm():
    storage_service = FakeStorageService()
    ai_service = FakeAIService()
    model = FakeModel()

    storage_service.get = MagicMock(return_value="prompt")
    ai_service.invoke_model = MagicMock(return_value="result")

    invoke_llm_input = InvokeLLMInput(assessment_id="AID", prompt_uri="s3://bucket/key")
    task = InvokeLLM(storage_service, ai_service, model)
    result = task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key="key")
    ai_service.invoke_model.assert_called_once_with(model, "prompt")
    assert result == "result"
