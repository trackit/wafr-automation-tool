from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.rescan_assessment import RescanAssessment

from api.event import RescanAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
sfn_client = boto3.client("stepfunctions")
task = RescanAssessment(assessment_service, sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    response = task.execute(
        RescanAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"]),
    )
    return response.build()
