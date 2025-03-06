from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class ScanningTool(StrEnum):
    PROWLER = "prowler"


class PreparePromptsInput(BaseModel):
    assessment_id: str
    scanning_tool: ScanningTool


class FormatProwlerInput(BaseModel):
    assessment_id: str
    prowler_output: list[dict[str, Any]]


class InvokeLLMInput(BaseModel):
    assessment_id: str
    prompt_uri: str


class StoreResultsInput(BaseModel):
    assessment_id: str
    llm_response: str
    prompt_uri: str


class StateMachineError(BaseModel):
    Error: str
    Cause: str


class CleanupInput(BaseModel):
    assessment_id: str
    error: StateMachineError | None = None


class CreatePromptsInput(BaseModel):
    assessment_id: str
