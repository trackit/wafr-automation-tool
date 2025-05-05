from http.client import NOT_FOUND
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import UpdateAssessmentInput


class UpdateAssessment(Task[UpdateAssessmentInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(self, event: UpdateAssessmentInput) -> APIResponse[None]:
        success = self.assessment_service.update_assessment(
            assessment_id=event.assessment_id,
            owner_id=event.owner_id,
            assessment_dto=event.assessment_dto,
        )
        if not success:
            return APIResponse(status_code=NOT_FOUND, body=None)
        return APIResponse(
            status_code=200,
            body=None,
        )
