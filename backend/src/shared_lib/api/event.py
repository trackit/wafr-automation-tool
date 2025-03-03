from common.entities import Assessment, FindingExtra
from pydantic import BaseModel
from utils.api import APIResponseBody


class StartAssessmentInput(BaseModel):
    name: str
    role: str


class StartAssessmentResponseBody(APIResponseBody):
    assessmentId: str


class StateMachineInput(BaseModel):
    id: str
    name: str
    role: str


class DeleteAssessmentInput(BaseModel):
    id: str


class RetrieveAssessmentInput(BaseModel):
    id: str


class RetrieveAssessmentResponseBody(APIResponseBody, Assessment):
    pass


class RetrieveBestPracticeInput(BaseModel):
    id: str
    bestPractice: str


RetrieveBestPracticeResponseBody = list[FindingExtra]


class RetrieveFindingInput(BaseModel):
    id: str
    findingId: str


class RetrieveFindingResponseBody(APIResponseBody, FindingExtra):
    pass


RetrieveAllAssessmentsResponseBody = list[Assessment]
