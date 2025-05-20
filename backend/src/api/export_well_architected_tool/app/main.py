import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.export_well_architected_tool import ExportWellArchitectedTool
from utils.api import get_user_organization_id, OrganizationExtractionError

from api.event import ExportWellArchitectedToolInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
well_architect_client = boto3.client("wellarchitected")
task = ExportWellArchitectedTool(assessment_service, well_architect_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        try:
            organization = get_user_organization_id(event)
        except (KeyError, AttributeError, IndexError) as e:
            raise OrganizationExtractionError("Impossible to extract the user organization") from e

        body = json.loads(event["body"])
        response = task.execute(
            ExportWellArchitectedToolInput(
                **body,
                assessment_id=event["pathParameters"]["assessmentId"],
                organization=organization,
            ),
        )
        return response.build()
    except OrganizationExtractionError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)}),
        }
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
