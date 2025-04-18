from typing import TypedDict

from pydantic import BaseModel

from entities.finding import Finding

Prompt = str
PromptS3Uri = str
Chunk = list[Finding]
ChunkId = str


class AIFindingAssociation(TypedDict):
    id: int
    start: int
    end: int


class AnswerData(BaseModel):
    pillar: str
    question: str
    best_practice: str


class PromptVariables(BaseModel):
    scanning_tool_title: str
    question_set_data: str
    scanning_tool_data: Chunk
