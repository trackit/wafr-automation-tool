from http.client import NOT_FOUND, OK
from typing import override

from api.assessment import IAssessmentRepository
from api.event import DeleteAssessmentInput
from common.task import Task
from utils.api import APIResponse


class DeleteAssessment(Task[DeleteAssessmentInput, APIResponse[None]]):
    def __init__(self, assessment_repository: IAssessmentRepository) -> None:
        self.assessment_repository = assessment_repository

    @override
    def execute(self, event: DeleteAssessmentInput) -> APIResponse[None]:
        delete_response = self.assessment_repository.delete_assessment(event.id)
        return APIResponse(
            statusCode=OK if delete_response else NOT_FOUND,
            body=None,
        )
