from typing import override

from entities.ai import Prompt
from entities.models import IModel
from services.ai import IAIService


class FakeAIService(IAIService):
    @override
    def converse(self, model: IModel, prompt: Prompt) -> str:
        raise NotImplementedError
