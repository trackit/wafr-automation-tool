from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_finding import RetrieveFinding

from api.event import RetrieveFindingInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveFinding(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    response = task.execute(
        RetrieveFindingInput(
            assessment_id=event["pathParameters"]["assessmentId"],
            owner_id=user_id,
            finding_id=event["pathParameters"]["findingId"],
        )
    )
    return response.build()
