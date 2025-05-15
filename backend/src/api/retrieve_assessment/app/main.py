import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_assessment import RetrieveAssessment

from api.event import RetrieveAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveAssessment(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = event["requestContext"]["authorizer"]["claims"]["email"].split("@")[1]

        response = task.execute(
            RetrieveAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"], organization=organization),
        )
        return response.build()
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
