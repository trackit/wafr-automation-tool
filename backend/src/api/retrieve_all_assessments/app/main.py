import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_all_assessments import RetrieveAllAssessments
from utils.api import UnauthorizedError, get_bearer_token

from api.event import RetrieveAllAssessmentsInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveAllAssessments(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        auth_header = get_bearer_token(event)

        query_string_parameters = event.get("queryStringParameters")
        task_input = RetrieveAllAssessmentsInput(
            api_id=event["requestContext"]["apiId"], limit=999999, owner_id=auth_header
        )
        if query_string_parameters:
            task_input.limit = int(query_string_parameters.get("limit", 10))
            task_input.search = query_string_parameters.get("search", None)
            task_input.next_token = query_string_parameters.get("next_token", None)
        response = task.execute(task_input)
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
