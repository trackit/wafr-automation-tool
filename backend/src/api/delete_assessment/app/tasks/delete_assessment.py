from http.client import NOT_FOUND, OK
from typing import override

from api.event import DeleteAssessmentInput
from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse


class DeleteAssessment(Task[DeleteAssessmentInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        self.assessment_service = assessment_service

    @override
    def execute(self, event: DeleteAssessmentInput) -> APIResponse[None]:
        delete_response = self.assessment_service.delete_assessment(event.id)
        return APIResponse(
            statusCode=OK if delete_response else NOT_FOUND,
            body=None,
        )
