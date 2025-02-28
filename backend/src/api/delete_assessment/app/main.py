from typing import Any, Dict

import boto3
from api.event import DeleteAssessmentInput
from tasks.DeleteAssessment import DeleteAssessment

ddb_resource = boto3.resource("dynamodb")
delete_assessments_task = DeleteAssessment(ddb_resource)


def lambda_handler(event: Dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = delete_assessments_task.execute(
            DeleteAssessmentInput(id=event["pathParameters"]["assessmentId"])
        )
    except Exception as e:
        return {
            "statusCode": 400,
            "body": str(e),
        }
    return {
        "statusCode": response.statusCode,
        "body": None,
    }
