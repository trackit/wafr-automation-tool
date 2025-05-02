from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import UpdateQuestionInput


class UpdateQuestion(Task[UpdateQuestionInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(self, event: UpdateQuestionInput) -> APIResponse[None]:
        assessment = self.assessment_service.retrieve(event.assessment_id, "123")  # temporaire
        if not assessment:
            return APIResponse(
                status_code=NOT_FOUND,
                body=None,
            )
        self.assessment_service.update_question(assessment, event.pillar_id, event.question_id, event.question_dto)
        return APIResponse(
            status_code=OK,
            body=None,
        )
