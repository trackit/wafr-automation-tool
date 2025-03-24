from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import RetrieveBestPracticeFindingsInput, RetrieveBestPracticeFindingsResponseBody


class RetrieveBestPracticeFindings(
    Task[RetrieveBestPracticeFindingsInput, APIResponse[RetrieveBestPracticeFindingsResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(
        self,
        event: RetrieveBestPracticeFindingsInput,
    ) -> APIResponse[RetrieveBestPracticeFindingsResponseBody]:
        assessment = self.assessment_service.retrieve(event.assessment_id)
        if not assessment:
            return APIResponse(status_code=NOT_FOUND, body=None)
        findings = self.assessment_service.retrieve_best_practice(
            assessment,
            event.pillar_id,
            event.question_id,
            event.best_practice_id,
        )
        if not findings:
            return APIResponse(status_code=NOT_FOUND, body=None)
        return APIResponse(
            status_code=OK,
            body=findings,
        )
