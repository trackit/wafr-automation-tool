from typing import Optional

from pydantic import BaseModel


class APIResponseBody(BaseModel):
    pass


class APIResponse[T: Optional[APIResponseBody]](BaseModel):
    statusCode: int
    body: Optional[T]


class StartAssessmentInput(BaseModel):
    name: str
    role: str


class StartAssessmentResponseBody(APIResponseBody):
    assessmentId: int


class StateMachineInput(BaseModel):
    id: str
    name: str
    role: str
