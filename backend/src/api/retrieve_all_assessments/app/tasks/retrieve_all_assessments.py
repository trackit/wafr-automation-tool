from http.client import INTERNAL_SERVER_ERROR, OK
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import RetrieveAllAssessmentsResponseBody


class RetrieveAllAssessments(
    Task[None, APIResponse[RetrieveAllAssessmentsResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(self, event: None) -> APIResponse[RetrieveAllAssessmentsResponseBody]:
        assessments = self.assessment_service.retrieve_all_assessments()
        if not assessments:
            return APIResponse(
                status_code=INTERNAL_SERVER_ERROR,
                body=[],
            )
        return APIResponse(
            status_code=OK,
            body=assessments,
        )
