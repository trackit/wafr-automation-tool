from http.client import NOT_FOUND, OK
from typing import override

from api.event import RetrieveFindingInput, RetrieveFindingResponseBody
from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse


class RetrieveFinding(
    Task[RetrieveFindingInput, APIResponse[RetrieveFindingResponseBody]]
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        self.assessment_service = assessment_service

    @override
    def execute(
        self, event: RetrieveFindingInput
    ) -> APIResponse[RetrieveFindingResponseBody]:
        finding = self.assessment_service.retrieve_finding(event.id, event.findingId)
        if not finding:
            return APIResponse(statusCode=NOT_FOUND, body=None)
        return APIResponse(
            statusCode=OK,
            body=RetrieveFindingResponseBody(
                **finding.dict(),
            ),
        )
