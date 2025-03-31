from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import UpdateFindingHideInput


class UpdateFindingHide(Task[UpdateFindingHideInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(self, event: UpdateFindingHideInput) -> APIResponse[None]:
        assessment = self.assessment_service.retrieve(event.assessment_id)
        if not assessment:
            return APIResponse(
                status_code=NOT_FOUND,
                body=None,
            )
        self.assessment_service.update_finding(
            assessment, event.pillar_id, event.question_id, event.best_practice_id, event.finding_id, event.hide
        )
        return APIResponse(
            status_code=OK,
            body=None,
        )
