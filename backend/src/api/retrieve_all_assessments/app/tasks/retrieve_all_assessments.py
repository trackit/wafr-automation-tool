import base64
import json
from http.client import OK
from typing import Any, override

from common.task import Task
from entities.api import APIAssessment, APIPagination
from services.assessment import IAssessmentService
from utils.api import APIResponse
from utils.assessment import convert_all_assessments_to_api_assessments

from api.event import RetrieveAllAssessmentsInput, RetrieveAllAssessmentsResponseBody


class RetrieveAllAssessments(
    Task[RetrieveAllAssessmentsInput, APIResponse[RetrieveAllAssessmentsResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    def remove_findings(self, assessments: list[APIAssessment]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for assessment in assessments:
            assessment_dict = assessment.model_dump()
            del assessment_dict["findings"]
            result.append(assessment_dict)
        return result

    def create_filter(self, event: RetrieveAllAssessmentsInput) -> tuple[str, dict[str, Any], dict[str, Any]]:
        attribute_name = {"#owner_id": "owner_id"}
        attribute_value = {":owner_id": event.owner_id}

        if event.search:
            filter_expression = (
                "(contains(#name, :name) OR begins_with(#id, :id) OR contains(#role_arn, :role_arn)) "
                "AND #owner_id = :owner_id"
            )
            attribute_name.update(
                {
                    "#name": "name",
                    "#id": "id",
                    "#role_arn": "role_arn",
                }
            )
            attribute_value.update(
                {
                    ":name": event.search,
                    ":id": event.search,
                    ":role_arn": event.search,
                }
            )
        else:
            filter_expression = "#owner_id = :owner_id"

        return (filter_expression, attribute_name, attribute_value)

    @override
    def execute(self, event: RetrieveAllAssessmentsInput) -> APIResponse[RetrieveAllAssessmentsResponseBody]:
        filter_expression, attribute_name, attribute_value = self.create_filter(event)
        pagination = APIPagination(
            limit=event.limit,
            next_token=event.next_token,
            filter_expression=filter_expression,
            attribute_name=attribute_name,
            attribute_value=attribute_value,
        )
        paginated = self.assessment_service.retrieve_all(pagination)
        next_token = (
            base64.b64encode(json.dumps(paginated.next_token).encode()).decode() if paginated.next_token else None
        )
        api_assessments = convert_all_assessments_to_api_assessments(paginated.items)
        return APIResponse(
            status_code=OK,
            body=RetrieveAllAssessmentsResponseBody(
                assessments=self.remove_findings(api_assessments), next_token=next_token
            ),
        )
