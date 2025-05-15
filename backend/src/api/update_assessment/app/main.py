import json
from typing import Any

import boto3
from entities.assessment import AssessmentDto
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_assessment import UpdateAssessment

from api.event import UpdateAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = UpdateAssessment(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = event["requestContext"]["authorizer"]["claims"]["email"].split("@")[1]

        body = json.loads(event["body"])
        assessement_dto = AssessmentDto(**body)
        response = task.execute(
            UpdateAssessmentInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                organization=organization,
                assessment_dto=assessement_dto,
            ),
        )
        return response.build()
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
