from enum import StrEnum
from typing import Any

from pydantic import BaseModel

from entities.question import FormattedPillar

AssessmentID = str


class Steps(StrEnum):
    SCANNING_STARTED = "SCANNING_STARTED"
    PREPARING_PROMPTS = "PREPARING_PROMPTS"
    INVOKING_LLM = "INVOKING_LLM"
    FINISHED = "FINISHED"
    ERRORED = "ERRORED"


class Assessment(BaseModel):
    id: AssessmentID
    name: str
    regions: list[str]
    role_arn: str
    workflow: str
    created_at: str
    step: Steps
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, FormattedPillar] | None = None


class AssessmentDto(BaseModel):
    name: str | None = None
    role_arn: str | None = None
    created_at: str | None = None
    step: Steps | None = None
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, FormattedPillar] | None = None
