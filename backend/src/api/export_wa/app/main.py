from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.export_wa import ExportWA

from api.event import ExportWAInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
well_architect_service = boto3.client("wellarchitected")
task = ExportWA(assessment_service, well_architect_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    response = task.execute(
        ExportWAInput(
            assessment_id=event["pathParameters"]["assessmentId"],
        ),
    )
    return response.build()
