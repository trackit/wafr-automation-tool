from http.client import INTERNAL_SERVER_ERROR, NOT_FOUND, OK
from typing import override

from common.task import Task
from exceptions.database import DynamoDBError
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import UpdateBestPracticeStatusInput


class UpdateBestPracticeStatus(Task[UpdateBestPracticeStatusInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(self, event: UpdateBestPracticeStatusInput) -> APIResponse[None]:
        try:
            assessment = self.assessment_service.retrieve(event.assessment_id)
            if not assessment:
                return APIResponse(
                    status_code=NOT_FOUND,
                    body=None,
                )
            if not self.assessment_service.update_best_practice(
                assessment, event.pillar_id, event.question_id, event.best_practice_id, event.status
            ):
                return APIResponse(
                    status_code=NOT_FOUND,
                    body=None,
                )
        except DynamoDBError:
            return APIResponse(
                status_code=INTERNAL_SERVER_ERROR,
                body=None,
            )
        return APIResponse(
            status_code=OK,
            body=None,
        )
