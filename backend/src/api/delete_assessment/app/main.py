import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.delete_assessment import DeleteAssessment
from utils.api import UnauthorizedError, get_bearer_token

from api.event import DeleteAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
sfn_client = boto3.client("stepfunctions")
task_delete = DeleteAssessment(assessment_service, sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        auth_header = get_bearer_token(event)

        response = task_delete.execute(
            DeleteAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"], owner_id=auth_header),
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
