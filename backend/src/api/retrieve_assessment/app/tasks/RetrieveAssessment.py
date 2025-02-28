from typing import Any, Optional, override

from api.config import DDB_TABLE
from api.event import Assessment, RetrieveAssessmentInput
from common.task import Task
from types_boto3_dynamodb import DynamoDBServiceResource


class RetrieveAssessment(Task[RetrieveAssessmentInput, Optional[Assessment]]):
    def __init__(self, ddb_resource: DynamoDBServiceResource) -> None:
        self.ddb_table = ddb_resource.Table(DDB_TABLE)

    def retrieve_assessment(
        self, event: RetrieveAssessmentInput
    ) -> Optional[Assessment]:
        assessment_data = self.ddb_table.get_item(
            Key={"id": event.id, "finding_id": "0"}
        )
        item: Optional[dict[str, Any]] = assessment_data.get("Item", None)
        if not item:
            return None
        findings: Optional[dict[str, Any]] = item.get("findings", None)
        return Assessment(
            id=str(item.get("id", "")),
            name=str(item.get("name", "")),
            role=str(item.get("role", "")),
            step=str(item.get("step", "")),
            questionVersion=str(item.get("question_version", "")),
            findings=findings,
        )

    @override
    def execute(self, event: RetrieveAssessmentInput) -> Optional[Assessment]:
        return self.retrieve_assessment(event)
