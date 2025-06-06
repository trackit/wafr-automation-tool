from typing import Any

from entities.api import APIAssessment
from entities.assessment import AssessmentDto, AssessmentID
from entities.best_practice import BestPracticeDto, BestPracticeID
from entities.finding import FindingDto, FindingExtra, FindingID
from entities.question import PillarDto, PillarID, QuestionDto, QuestionID
from pydantic import BaseModel, Field
from utils.api import APIResponseBody


class StartAssessmentInput(BaseModel):
    name: str
    regions: list[str] = []
    role_arn: str = Field(alias="roleArn")
    workflows: list[str] = []
    created_by: str
    organization: str


class StartAssessmentResponseBody(APIResponseBody):
    assessment_id: AssessmentID = Field(alias="assessmentId")


class StateMachineInput(BaseModel):
    assessment_id: AssessmentID
    created_by: str
    name: str
    regions: list[str]
    role_arn: str
    workflows: list[str]
    created_at: str
    organization: str


class DeleteAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    organization: str


class RetrieveAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    organization: str


class RetrieveAssessmentResponseBody(APIResponseBody, APIAssessment):
    pass


class RescanAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    organization: str


class RetrieveBestPracticeFindingsInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    organization: str
    limit: int
    search: str | None = None
    show_hidden: bool = False
    next_token: str | None = None


class RetrieveBestPracticeFindingsResponseBody(APIResponseBody):
    items: list[FindingExtra]
    next_token: str | None


class RetrieveFindingInput(BaseModel):
    assessment_id: AssessmentID
    organization: str
    finding_id: FindingID


class RetrieveFindingResponseBody(APIResponseBody, FindingExtra):
    pass


class RetrieveAllAssessmentsInput(BaseModel):
    limit: int
    search: str | None = None
    next_token: str | None = None
    organization: str


class RetrieveAllAssessmentsResponseBody(APIResponseBody):
    assessments: list[dict[str, Any]]
    next_token: str | None


class UpdateAssessmentInput(BaseModel):
    assessment_id: AssessmentID
    assessment_dto: AssessmentDto
    organization: str


class UpdateBestPracticeInput(BaseModel):
    assessment_id: AssessmentID
    organization: str
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    best_practice_dto: BestPracticeDto


class UpdatePillarInput(BaseModel):
    assessment_id: AssessmentID
    organization: str
    pillar_id: PillarID
    pillar_dto: PillarDto


class ExportWellArchitectedToolInput(BaseModel):
    assessment_id: AssessmentID
    organization: str
    owner: str


class UpdateQuestionInput(BaseModel):
    assessment_id: AssessmentID
    organization: str
    pillar_id: PillarID
    question_id: QuestionID
    question_dto: QuestionDto


class UpdateFindingInput(BaseModel):
    assessment_id: AssessmentID
    organization: str
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    finding_id: FindingID
    finding_dto: FindingDto
