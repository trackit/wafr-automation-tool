from enum import StrEnum
from typing import TypedDict

from pydantic import BaseModel

Prompt = str
PromptS3Uri = str
ChunkId = str


class AIFindingAssociation(TypedDict):
    id: int
    start: int
    end: int


class AIModel(StrEnum):
    Claude3Dot5Sonnet = "claude-3-5-sonnet"
    Claude3Dot7Sonnet = "claude-3-7-sonnet"
    DeepseekR1 = "deepseek-r1"
    NovaPro = "nova-pro"
    NovaLite = "nova-lite"
    NovaMicro = "nova-micro"


class AnswerData(BaseModel):
    pillar: str
    question: str
    best_practice: str
