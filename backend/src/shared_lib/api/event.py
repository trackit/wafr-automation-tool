import json
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel


class APIResponseBody(BaseModel):
    pass


class DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any):
        if isinstance(o, Decimal):
            return int(o)
        return super(DecimalEncoder, self).default(o)


class APIResponse[T: Optional[APIResponseBody]](BaseModel):
    statusCode: int
    body: Optional[T]

    def build(self) -> dict[str, Any]:
        return {
            "statusCode": self.statusCode,
            "body": (
                None
                if self.body is None
                else json.dumps(self.body.dict(), cls=DecimalEncoder)
            ),
        }


class StartAssessmentInput(BaseModel):
    name: str
    role: str


class StartAssessmentResponseBody(APIResponseBody):
    assessmentId: int


class StateMachineInput(BaseModel):
    id: str
    name: str
    role: str


class Assessment(BaseModel):
    id: str
    name: str
    role: str
    step: str
    question_version: str
    findings: Optional[dict[str, Any]]


class DeleteAssessmentInput(BaseModel):
    id: str


class RetrieveAssessmentInput(BaseModel):
    id: str


class RetrieveAssessmentResponseBody(APIResponseBody, Assessment):
    pass
