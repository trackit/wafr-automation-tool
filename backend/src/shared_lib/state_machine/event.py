from typing import Any

from entities.ai import PromptS3Uri
from entities.assessment import AssessmentID
from entities.scanning_tools import ScanningTool
from pydantic import BaseModel


class PreparePromptsInput(BaseModel):
    assessment_id: AssessmentID
    scanning_tool: ScanningTool
    regions: list[str]
    workflows: list[str]


class FormatProwlerInput(BaseModel):
    assessment_id: AssessmentID
    prowler_output: list[dict[str, Any]]


class InvokeLLMInput(BaseModel):
    assessment_id: AssessmentID
    prompt_arn: str
    prompt_uri: PromptS3Uri


class StoreResultsInput(BaseModel):
    assessment_id: AssessmentID
    prompt_uri: PromptS3Uri
    llm_response: str


class StateMachineError(BaseModel):
    Error: str
    Cause: str


class CleanupInput(BaseModel):
    assessment_id: AssessmentID
    error: StateMachineError | None = None


class CreatePromptsInput(BaseModel):
    assessment_id: AssessmentID
    scanning_tool: ScanningTool
