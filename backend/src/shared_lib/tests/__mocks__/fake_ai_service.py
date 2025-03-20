from typing import override

from common.models import IModel
from services.ai import IAIService


class FakeAIService(IAIService):
    @override
    def converse(self, model: IModel, prompt: str) -> str:
        raise NotImplementedError
