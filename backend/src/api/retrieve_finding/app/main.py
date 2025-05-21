import json
from http.client import BAD_REQUEST
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_finding import RetrieveFinding
from utils.api import OrganizationExtractionError, get_user_organization_id

from api.event import RetrieveFindingInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveFinding(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = get_user_organization_id(event)

        response = task.execute(
            RetrieveFindingInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                organization=organization,
                finding_id=event["pathParameters"]["findingId"],
            )
        )
        return response.build()
    except OrganizationExtractionError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": str(e)}),
        }

