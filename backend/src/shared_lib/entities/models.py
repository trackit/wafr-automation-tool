from pydantic import BaseModel


class IModel(BaseModel):
    id: str
    temperature: float
    max_tokens: int


class Claude3Dot5Sonnet(IModel):
    id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    temperature: float = 0
    max_tokens: int = 8192


class Claude3Dot7Sonnet(IModel):
    id: str = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    temperature: float = 0
    max_tokens: int = 8192


class DeepSeekR1(IModel):
    id: str = "us.deepseek.r1-v1:0"
    temperature: float = 0
    max_tokens: int = 32768


class NovaPro(IModel):
    id: str = "us.amazon.nova-pro-v1:0"
    temperature: float = 0
    max_tokens: int = 5120
