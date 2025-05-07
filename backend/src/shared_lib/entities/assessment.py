from enum import StrEnum
from typing import Any, TypedDict

from pydantic import BaseModel

from entities.question import Pillar

AssessmentID = str


class Steps(StrEnum):
    SCANNING_STARTED = "SCANNING_STARTED"
    PREPARING_PROMPTS = "PREPARING_PROMPTS"
    INVOKING_LLM = "INVOKING_LLM"
    FINISHED = "FINISHED"
    ERRORED = "ERRORED"


class AssessmentData(TypedDict):
    regions: dict[str, int]
    resource_types: dict[str, int]
    severities: dict[str, int]
    findings: int


class Assessment(BaseModel):
    id: AssessmentID
    name: str
    regions: list[str] = []
    role_arn: str
    workflows: list[str] = []
    step: Steps
    execution_arn: str | None = None
    created_at: str
    raw_graph_datas: dict[str, AssessmentData] | None = None
    graph_datas: AssessmentData | None = None
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, Pillar] | None = None


class AssessmentDto(BaseModel):
    name: str | None = None
    role_arn: str | None = None
    created_at: str | None = None
    step: Steps | None = None
    raw_graph_datas: dict[str, AssessmentData] | None = None
    graph_datas: AssessmentData | None = None
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, Pillar] | None = None
