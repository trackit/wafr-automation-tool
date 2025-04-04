from entities.models import IModel


class FakeModel(IModel):
    id: str = "fake-model"
    temperature: float = 0.0
    max_tokens: int = 100
