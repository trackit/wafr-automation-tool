from http.client import INTERNAL_SERVER_ERROR, OK
from typing import override

from api.assessment import IAssessmentRepository
from api.event import RetrieveAllAssessmentsResponseBody
from common.task import Task
from utils.api import APIResponse


class RetrieveAllAssessments(
    Task[None, APIResponse[RetrieveAllAssessmentsResponseBody]]
):
    def __init__(self, assessment_repository: IAssessmentRepository) -> None:
        self.assessment_repository = assessment_repository

    @override
    def execute(self, event: None) -> APIResponse[RetrieveAllAssessmentsResponseBody]:
        assessments = self.assessment_repository.retrieve_all_assessments()
        if not assessments:
            return APIResponse(
                statusCode=INTERNAL_SERVER_ERROR,
                body=[],
            )
        return APIResponse(
            statusCode=OK,
            body=assessments,
        )
