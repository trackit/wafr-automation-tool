from http.client import NOT_FOUND, OK
from typing import Any, Optional, override

from api.config import DDB_TABLE
from api.event import (
    APIResponse,
    RetrieveAssessmentInput,
    RetrieveAssessmentResponseBody,
)
from common.task import Task
from types_boto3_dynamodb import DynamoDBServiceResource


class RetrieveAssessment(
    Task[RetrieveAssessmentInput, APIResponse[RetrieveAssessmentResponseBody]]
):
    def __init__(self, ddb_resource: DynamoDBServiceResource) -> None:
        self.ddb_table = ddb_resource.Table(DDB_TABLE)

    def retrieve_assessment(
        self, event: RetrieveAssessmentInput
    ) -> APIResponse[RetrieveAssessmentResponseBody]:
        assessment_data = self.ddb_table.get_item(
            Key={"id": event.id, "finding_id": "0"}
        )
        item: Optional[dict[str, Any]] = assessment_data.get("Item", None)
        if not item:
            return APIResponse(statusCode=NOT_FOUND, body=None)
        findings: Optional[dict[str, Any]] = item.get("findings", None)
        return APIResponse(
            statusCode=OK,
            body=RetrieveAssessmentResponseBody(
                **item,
                findings=findings,
            ),
        )

    @override
    def execute(
        self, event: RetrieveAssessmentInput
    ) -> APIResponse[RetrieveAssessmentResponseBody]:
        return self.retrieve_assessment(event)
