import base64
import json
from http.client import INTERNAL_SERVER_ERROR, OK
from typing import Any, override

from common.entities import Assessment, Pagination
from common.task import Task
from services.assessment import IAssessmentService
from utils.api import APIResponse

from api.event import RetrieveAllAssessmentsInput, RetrieveAllAssessmentsResponseBody


class RetrieveAllAssessments(
    Task[RetrieveAllAssessmentsInput, APIResponse[RetrieveAllAssessmentsResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    def remove_findings(self, assessments: list[Assessment]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for assessment in assessments:
            assessment_dict = assessment.model_dump()
            del assessment_dict["findings"]
            result.append(assessment_dict)
        return result

    def create_filter(self, event: RetrieveAllAssessmentsInput) -> tuple[str, dict[str, Any], dict[str, Any]]:
        filter_expression = "begins_with(#name, :name) OR begins_with(#id, :id) OR begins_with(#role_arn, :role_arn)"
        attribute_name = {
            "#name": "name",
            "#id": "id",
            "#role_arn": "role_arn",
        }
        attribute_value = {
            ":name": event.search,
            ":id": event.search,
            ":role_arn": event.search,
        }
        return (filter_expression, attribute_name, attribute_value)

    @override
    def execute(self, event: RetrieveAllAssessmentsInput) -> APIResponse[RetrieveAllAssessmentsResponseBody]:
        filter_expression, attribute_name, attribute_value = (
            self.create_filter(event) if event.search else (None, None, None)
        )
        pagination = Pagination(
            limit=event.limit,
            next_token=event.next_token,
            filter=filter_expression,
            attribute_name=attribute_name,
            attribute_value=attribute_value,
        )
        paginated = self.assessment_service.retrieve_all(pagination)
        if not paginated:
            return APIResponse(
                status_code=INTERNAL_SERVER_ERROR,
                body=None,
            )
        next_token = (
            base64.b64encode(json.dumps(paginated.next_token).encode()).decode() if paginated.next_token else None
        )
        return APIResponse(
            status_code=OK,
            body=RetrieveAllAssessmentsResponseBody(
                assessments=self.remove_findings(paginated.items), next_token=next_token
            ),
        )
