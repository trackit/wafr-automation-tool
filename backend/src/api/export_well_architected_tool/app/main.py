import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService

from api.event import ExportWellArchitectedToolInput
from src.api.export_well_architected_tool.app.tasks.export_well_architected_tool import ExportWellArchitectedTool

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
well_architect_client = boto3.client("wellarchitected")
task = ExportWellArchitectedTool(assessment_service, well_architect_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        body = json.loads(event["body"])
        response = task.execute(
            ExportWellArchitectedToolInput(
                **body,
                assessment_id=event["pathParameters"]["assessmentId"],
            ),
        )
        return response.build()
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
