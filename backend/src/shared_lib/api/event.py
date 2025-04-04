from typing import Any

from entities.api import APIAssessment
from entities.assessment import AssessmentDto, AssessmentID
from entities.best_practice import BestPracticeDto, BestPracticeExtra, BestPracticeID
from entities.finding import FindingDto, FindingExtra, FindingID
from entities.question import PillarDto, PillarID, QuestionDto, QuestionID
from pydantic import BaseModel
from utils.api import APIResponseBody


class StartAssessmentInput(BaseModel):
    name: str
    roleArn: str | None = None  # noqa: N815


class StartAssessmentResponseBody(APIResponseBody):
    assessmentId: AssessmentID  # noqa: N815


class StateMachineInput(BaseModel):
    assessment_id: AssessmentID
    name: str
    role_arn: str
    created_at: str


class DeleteAssessmentInput(BaseModel):
    assessment_id: AssessmentID


class RetrieveAssessmentInput(BaseModel):
    assessment_id: AssessmentID


class RetrieveAssessmentResponseBody(APIResponseBody, APIAssessment):
    pass


class RescanAssessmentInput(BaseModel):
    assessment_id: AssessmentID


class RetrieveBestPracticeFindingsInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID


RetrieveBestPracticeFindingsResponseBody = BestPracticeExtra


class RetrieveFindingInput(BaseModel):
    assessment_id: AssessmentID
    finding_id: FindingID


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
    assessment_id: AssessmentID
    assessment_dto: AssessmentDto


class UpdateBestPracticeInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    best_practice_dto: BestPracticeDto


class UpdatePillarInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    pillar_dto: PillarDto


class UpdateQuestionInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    question_dto: QuestionDto


class UpdateFindingInput(BaseModel):
    assessment_id: AssessmentID
    pillar_id: PillarID
    question_id: QuestionID
    best_practice_id: BestPracticeID
    finding_id: FindingID
    finding_dto: FindingDto
