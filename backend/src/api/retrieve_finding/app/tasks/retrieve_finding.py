from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import RetrieveFindingInput, RetrieveFindingResponseBody


class RetrieveFinding(
    Task[RetrieveFindingInput, APIResponse[RetrieveFindingResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    @override
    def execute(
        self,
        event: RetrieveFindingInput,
    ) -> APIResponse[RetrieveFindingResponseBody]:
        finding = self.assessment_service.retrieve_finding(event.assessment_id, event.owner_id, event.finding_id)
        if not finding:
            return APIResponse(status_code=NOT_FOUND, body=None)
        return APIResponse(
            status_code=OK,
            body=RetrieveFindingResponseBody(
                **finding.model_dump(exclude_none=True),
            ),
        )
