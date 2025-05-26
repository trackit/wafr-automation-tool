import json
from http.client import BAD_REQUEST
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_assessment import RetrieveAssessment
from utils.api import OrganizationExtractionError, get_user_organization_id

from api.event import RetrieveAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveAssessment(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = get_user_organization_id(event)

        response = task.execute(
            RetrieveAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"], organization=organization),
        )
        return response.build()
    except OrganizationExtractionError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": str(e)}),
        }
