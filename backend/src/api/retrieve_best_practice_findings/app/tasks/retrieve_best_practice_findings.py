import base64
import json
from http.client import NOT_FOUND, OK
from typing import Any, override

from common.task import Task
from entities.api import APIPagination
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import (
    RetrieveBestPracticeFindingsInput,
    RetrieveBestPracticeFindingsResponseBody,
)


class RetrieveBestPracticeFindings(
    Task[RetrieveBestPracticeFindingsInput, APIResponse[RetrieveBestPracticeFindingsResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    def create_filter(self, event: RetrieveBestPracticeFindingsInput) -> tuple[str, dict[str, Any], dict[str, Any]]:
        filters: list[str] = []
        attribute_name = {}
        attribute_value = {}
        if event.search:
            filters.append("contains(#risk_details, :risk_details) OR contains(#status_detail, :status_detail)")
            attribute_name.update(
                {
                    "#risk_details": "risk_details",
                    "#status_detail": "status_detail",
                }
            )
            attribute_value.update(
                {
                    ":risk_details": event.search,
                    ":status_detail": event.search,
                }
            )
        if not event.show_hidden:
            filters.append("#hidden = :hidden")
            attribute_name.update(
                {
                    "#hidden": "hidden",
                }
            )
            attribute_value.update(
                {
                    ":hidden": False,
                }
            )
        filter_expression = (" AND ".join(f"({cond})" for cond in filters)) if filters else ""
        return (filter_expression, attribute_name, attribute_value)

    @override
    def execute(
        self,
        event: RetrieveBestPracticeFindingsInput,
    ) -> APIResponse[RetrieveBestPracticeFindingsResponseBody]:
        assessment = self.assessment_service.retrieve(event.assessment_id, event.organization)
        if not assessment:
            return APIResponse(status_code=NOT_FOUND, body=None)
        best_practice = self.assessment_service.retrieve_best_practice(
            assessment,
            event.pillar_id,
            event.question_id,
            event.best_practice_id,
        )
        if not best_practice:
            return APIResponse(status_code=NOT_FOUND, body=None)
        filter_expression, attribute_name, attribute_value = self.create_filter(event)
        pagination = APIPagination(
            limit=event.limit,
            next_token=event.next_token,
            filter_expression=filter_expression,
            attribute_name=attribute_name,
            attribute_value=attribute_value,
        )
        paginated = self.assessment_service.retrieve_best_practice_findings(
            pagination,
            event.assessment_id,
            event.organization,
            event.pillar_id,
            event.question_id,
            event.best_practice_id,
        )
        next_token = (
            base64.b64encode(json.dumps(paginated.next_token).encode()).decode() if paginated.next_token else None
        )
        return APIResponse(
            status_code=OK,
            body=RetrieveBestPracticeFindingsResponseBody(
                items=paginated.items,
                next_token=next_token,
            ),
        )
