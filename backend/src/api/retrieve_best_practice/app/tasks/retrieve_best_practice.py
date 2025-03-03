from http.client import NOT_FOUND, OK
from typing import override

from api.assessment import IAssessmentRepository
from api.event import RetrieveBestPracticeInput, RetrieveBestPracticeResponseBody
from common.task import Task
from utils.api import APIResponse


class RetrieveBestPractice(
    Task[RetrieveBestPracticeInput, APIResponse[RetrieveBestPracticeResponseBody]]
):
    def __init__(self, assessment_repository: IAssessmentRepository) -> None:
        self.assessment_repository = assessment_repository

    @override
    def execute(
        self, event: RetrieveBestPracticeInput
    ) -> APIResponse[RetrieveBestPracticeResponseBody]:
        assessment = self.assessment_repository.retrieve_assessment(event.id)
        if not assessment:
            return APIResponse(statusCode=NOT_FOUND, body=None)
        findings = self.assessment_repository.retrieve_best_practice(
            assessment, event.bestPractice
        )
        if not findings:
            return APIResponse(statusCode=NOT_FOUND, body=None)
        return APIResponse(
            statusCode=OK,
            body=findings,
        )
