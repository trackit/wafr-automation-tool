from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import RetrieveAssessmentInput, RetrieveAssessmentResponseBody


class RetrieveAssessment(
    Task[RetrieveAssessmentInput, APIResponse[RetrieveAssessmentResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(
        self,
        event: RetrieveAssessmentInput,
    ) -> APIResponse[RetrieveAssessmentResponseBody]:
        assessment = self.assessment_service.retrieve(event.assessment_id)
        if not assessment:
            return APIResponse(status_code=NOT_FOUND, body=None)
        return APIResponse(
            status_code=OK,
            body=RetrieveAssessmentResponseBody(
                **assessment.dict(),
            ),
        )
