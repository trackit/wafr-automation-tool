import json
from http.client import BAD_REQUEST
from typing import Any

import boto3
from api.event import ExportWellArchitectedToolInput
from exceptions.api import EmailExtractionError
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.export_well_architected_tool import ExportWellArchitectedTool
from utils.api import (
    OrganizationExtractionError,
    get_user_email,
    get_user_organization_id,
)

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
well_architect_client = boto3.client("wellarchitected")
task = ExportWellArchitectedTool(assessment_service, well_architect_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = get_user_organization_id(event)
        user_email = get_user_email(event)

        body = json.loads(event["body"])
        response = task.execute(
            ExportWellArchitectedToolInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                organization=organization,
                owner=user_email,
            ),
        )
        return response.build()
    except (EmailExtractionError, OrganizationExtractionError) as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": str(e)}),
        }
    except ValidationError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": e.errors()}),
        }
