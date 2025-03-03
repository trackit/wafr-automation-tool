from http.client import INTERNAL_SERVER_ERROR
from typing import Any, Dict

import boto3
from api.assessment import AssessmentRepository
from api.event import RetrieveAssessmentInput
from tasks.retrieve_assessment import RetrieveAssessment

ddb_resource = boto3.resource("dynamodb")
assessment_repository = AssessmentRepository(ddb_resource)
retrieve_assessment_task = RetrieveAssessment(assessment_repository)


def lambda_handler(event: Dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = retrieve_assessment_task.execute(
            RetrieveAssessmentInput(id=event["pathParameters"]["assessmentId"])
        )
    except Exception as e:
        return {
            "statusCode": INTERNAL_SERVER_ERROR,
            "body": str(e),
        }
    return response.build()
