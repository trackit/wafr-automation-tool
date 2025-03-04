from http.client import INTERNAL_SERVER_ERROR
from typing import Any, Dict

import boto3
from api.event import DeleteAssessmentInput
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.delete_assessment import DeleteAssessment

ddb_resource = boto3.resource("dynamodb")  # type: ignore
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
delete_assessments_task = DeleteAssessment(assessment_service)


def lambda_handler(event: Dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = delete_assessments_task.execute(
            DeleteAssessmentInput(id=event["pathParameters"]["assessmentId"])
        )
    except Exception as e:
        return {
            "statusCode": INTERNAL_SERVER_ERROR,
            "body": str(e),
        }
    return response.build()
