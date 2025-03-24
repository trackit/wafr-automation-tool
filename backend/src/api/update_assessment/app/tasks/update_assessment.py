from http.client import OK
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
        self.assessment_service.update(event.assessment_id, event.assessment_dto)
        return APIResponse(
            status_code=OK,
            body=None,
        )
