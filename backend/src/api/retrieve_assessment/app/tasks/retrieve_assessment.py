from http.client import NOT_FOUND, OK
from typing import override

from api.event import RetrieveAssessmentInput, RetrieveAssessmentResponseBody
from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse


class RetrieveAssessment(
    Task[RetrieveAssessmentInput, APIResponse[RetrieveAssessmentResponseBody]]
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        self.assessment_service = assessment_service

    @override
    def execute(
        self, event: RetrieveAssessmentInput
    ) -> APIResponse[RetrieveAssessmentResponseBody]:
        assessment = self.assessment_service.retrieve_assessment(event.id)
        if not assessment:
            return APIResponse(statusCode=NOT_FOUND, body=None)
        return APIResponse(
            statusCode=OK,
            body=RetrieveAssessmentResponseBody(
                **assessment.dict(),
            ),
        )
