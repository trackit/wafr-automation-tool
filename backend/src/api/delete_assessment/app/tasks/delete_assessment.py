from http.client import NO_CONTENT, NOT_FOUND
from typing import override

from api.config import DDB_TABLE
from api.event import APIResponse, DeleteAssessmentInput
from common.task import Task
from types_boto3_dynamodb import DynamoDBServiceResource


class DeleteAssessment(Task[DeleteAssessmentInput, APIResponse[None]]):
    def __init__(self, ddb_resource: DynamoDBServiceResource) -> None:
        self.ddb_table = ddb_resource.Table(DDB_TABLE)

    def delete_assessment(self, event: DeleteAssessmentInput) -> int:
        response = self.ddb_table.query(
            KeyConditionExpression="id = :id",
            ExpressionAttributeValues={":id": event.id},
        )
        items = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            response = self.ddb_table.query(
                KeyConditionExpression="id = :id",
                ExpressionAttributeValues={":id": event.id},
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        with self.ddb_table.batch_writer() as batch:
            for item in items:
                key = {"id": item["id"], "finding_id": item["finding_id"]}
                batch.delete_item(Key=key)
        return NO_CONTENT if items else NOT_FOUND

    @override
    def execute(self, event: DeleteAssessmentInput) -> APIResponse[None]:
        status_code = self.delete_assessment(event)
        return APIResponse(
            statusCode=status_code,
            body=None,
        )
