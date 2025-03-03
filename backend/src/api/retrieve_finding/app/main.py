from http.client import INTERNAL_SERVER_ERROR
from typing import Any

import boto3
from api.assessment import AssessmentRepository
from api.event import RetrieveFindingInput
from tasks.retrieve_finding import RetrieveFinding

ddb_resource = boto3.resource("dynamodb")
assessment_repository = AssessmentRepository(ddb_resource)
retrieve_finding_task = RetrieveFinding(assessment_repository)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = retrieve_finding_task.execute(
            RetrieveFindingInput(
                id=event["pathParameters"]["assessmentId"],
                findingId=event["pathParameters"]["findingId"],
            )
        )
    except Exception as e:
        return {
            "statusCode": INTERNAL_SERVER_ERROR,
            "body": str(e),
        }
    return response.build()
