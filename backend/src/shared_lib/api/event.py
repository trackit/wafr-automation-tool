from typing import Any

from common.entities import APIAssessment, AssessmentDto, BestPracticeExtra, FindingExtra
from pydantic import BaseModel
from utils.api import APIResponseBody


class StartAssessmentInput(BaseModel):
    name: str
    roleArn: str | None = None  # noqa: N815


class StartAssessmentResponseBody(APIResponseBody):
    assessmentId: str  # noqa: N815


class StateMachineInput(BaseModel):
    assessment_id: str
    name: str
    role_arn: str
    created_at: str


class DeleteAssessmentInput(BaseModel):
    assessment_id: str


class RetrieveAssessmentInput(BaseModel):
    assessment_id: str


class RetrieveAssessmentResponseBody(APIResponseBody, APIAssessment):
    pass


class RescanAssessmentInput(BaseModel):
    assessment_id: str


class RetrieveBestPracticeFindingsInput(BaseModel):
    assessment_id: str
    pillar_id: str
    question_id: str
    best_practice_id: str


RetrieveBestPracticeFindingsResponseBody = BestPracticeExtra


class RetrieveFindingInput(BaseModel):
    assessment_id: str
    finding_id: str


class RetrieveFindingResponseBody(APIResponseBody, FindingExtra):
    pass


class RetrieveAllAssessmentsInput(BaseModel):
    api_id: str
    limit: int
    search: str | None = None
    next_token: str | None = None


class RetrieveAllAssessmentsResponseBody(APIResponseBody):
    assessments: list[dict[str, Any]]
    next_token: str | None


class UpdateAssessmentInput(BaseModel):
    assessment_id: str
    assessment_dto: AssessmentDto


class UpdateBestPracticeStatusInput(BaseModel):
    assessment_id: str
    pillar_id: str
    question_id: str
    best_practice_id: str
    status: bool


class UpdateFindingHideInput(BaseModel):
    assessment_id: str
    pillar_id: str
    question_id: str
    best_practice_id: str
    finding_id: str
    hide: bool
