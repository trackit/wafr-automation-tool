from http.client import INTERNAL_SERVER_ERROR, OK
from typing import Any, override

from common.entities import Assessment
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

    def remove_findings(self, assessments: list[Assessment]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for assessment in assessments:
            assessment_dict = assessment.dict()
            del assessment_dict["findings"]
            result.append(assessment_dict)
        return result

    @override
    def execute(self, event: None) -> APIResponse[RetrieveAllAssessmentsResponseBody]:
        assessments = self.assessment_service.retrieve_all()
        if not assessments:
            return APIResponse(
                status_code=INTERNAL_SERVER_ERROR,
                body=None,
            )
        return APIResponse(
            status_code=OK,
            body=self.remove_findings(assessments),
        )
