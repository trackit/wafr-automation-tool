from http.client import NOT_FOUND, OK
from typing import override

from api.assessment import IAssessmentRepository
from api.event import RetrieveAssessmentInput, RetrieveAssessmentResponseBody
from common.task import Task
from utils.api import APIResponse


class RetrieveAssessment(
    Task[RetrieveAssessmentInput, APIResponse[RetrieveAssessmentResponseBody]]
):
    def __init__(self, assessment_repository: IAssessmentRepository) -> None:
        self.assessment_repository = assessment_repository

    @override
    def execute(
        self, event: RetrieveAssessmentInput
    ) -> APIResponse[RetrieveAssessmentResponseBody]:
        assessment = self.assessment_repository.retrieve_assessment(event.id)
        if not assessment:
            return APIResponse(statusCode=NOT_FOUND, body=None)
        return APIResponse(
            statusCode=OK,
            body=RetrieveAssessmentResponseBody(
                **assessment.dict(),
            ),
        )
