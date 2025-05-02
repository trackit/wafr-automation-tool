from os import O_WRONLY
from typing import Any

from entities.api import APIAssessment, APIBestPracticeExtra
from entities.assessment import AssessmentDto, AssessmentID
from entities.best_practice import BestPracticeDto, BestPracticeID
from entities.finding import FindingDto, FindingExtra, FindingID
from entities.question import PillarDto, PillarID, QuestionDto, QuestionID
from pydantic import BaseModel, Field
from utils.api import APIResponseBody


class StartAssessmentInput(BaseModel):
    name: str
    regions: list[str] = []
    role_arn: str | None = Field(default=None, alias="roleArn")
    workflows: list[str] = []
    owner_id: str


class StartAssessmentResponseBody(APIResponseBody):
    assessment_id: AssessmentID = Field(alias="assessmentId")


class StateMachineInput(BaseModel):
    assessment_id: AssessmentID
    name: str
    regions: list[str]
    role_arn: str
    workflows: list[str]
    created_at: str
    owner_id: str


class DeleteAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    owner_id: str


class RetrieveAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    owner_id: str


class RetrieveAssessmentResponseBody(APIResponseBody, APIAssessment):
    pass


class RescanAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    owner_id: str


class RetrieveBestPracticeFindingsInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    owner_id: str


RetrieveBestPracticeFindingsResponseBody = APIBestPracticeExtra


class RetrieveFindingInput(BaseModel):
    assessment_id: AssessmentID
    finding_id: FindingID
    owner_id: str


class RetrieveFindingResponseBody(APIResponseBody, FindingExtra):
    pass


class RetrieveAllAssessmentsInput(BaseModel):
    api_id: str
    limit: int
    search: str | None = None
    next_token: str | None = None
    owner_id: str


class RetrieveAllAssessmentsResponseBody(APIResponseBody):
    assessments: list[dict[str, Any]]
    next_token: str | None


class UpdateAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    assessment_dto: AssessmentDto
    owner_id: str


class UpdateBestPracticeInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    best_practice_dto: BestPracticeDto
    owner_id: str


class UpdatePillarInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    pillar_dto: PillarDto
    owner_id: str


class ExportWellArchitectedToolInput(BaseModel):
    assessment_id: AssessmentID
    owner: str | None = None


class UpdateQuestionInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    question_dto: QuestionDto
    owner_id: str


class UpdateFindingInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    finding_id: FindingID
    finding_dto: FindingDto
    owner_id: str
