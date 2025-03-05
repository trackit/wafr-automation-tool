from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_finding import RetrieveFinding

from api.event import RetrieveFindingInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
retrieve_finding_task = RetrieveFinding(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    response = retrieve_finding_task.execute(
        RetrieveFindingInput(
            assessment_id=event["pathParameters"]["assessmentId"],
            finding_id=event["pathParameters"]["findingId"],
        )
    )
    return response.build()
