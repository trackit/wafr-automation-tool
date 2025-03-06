from typing import Any

from common.entities import Assessment, FindingExtra
from pydantic import BaseModel
from utils.api import APIResponseBody


class StartAssessmentInput(BaseModel):
    name: str
    role: str | None = None


class StartAssessmentResponseBody(APIResponseBody):
    assessmentId: str  # noqa: N815


class StateMachineInput(BaseModel):
    assessment_id: str
    name: str
    role: str


class DeleteAssessmentInput(BaseModel):
    assessment_id: str


class RetrieveAssessmentInput(BaseModel):
    assessment_id: str


class RetrieveAssessmentResponseBody(APIResponseBody, Assessment):
    pass


class RetrieveBestPracticeFindingsInput(BaseModel):
    assessment_id: str
    best_practice: str


RetrieveBestPracticeFindingsResponseBody = list[FindingExtra]


class RetrieveFindingInput(BaseModel):
    assessment_id: str
    finding_id: str


class RetrieveFindingResponseBody(APIResponseBody, FindingExtra):
    pass


RetrieveAllAssessmentsResponseBody = list[dict[str, Any]]
