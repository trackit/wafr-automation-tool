import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.rescan_assessment import RescanAssessment

from api.event import RescanAssessmentInput
from utils.api import UnauthorizedError, get_bearer_token

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
sfn_client = boto3.client("stepfunctions")
task = RescanAssessment(assessment_service, sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        auth_header = get_bearer_token(event)

        response = task.execute(
            RescanAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"], owner_id=auth_header),
        )
        return response.build()
    except UnauthorizedError as e:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": str(e)}),
        }
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
