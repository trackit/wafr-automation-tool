from typing import override

from entities.ai import PromptVariables
from services.ai import IAIService


class FakeAIService(IAIService):
    @override
    def converse(self, prompt_arn: str, prompt_variables: PromptVariables) -> str:
        raise NotImplementedError
