import json
from http.client import BAD_REQUEST
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_all_assessments import RetrieveAllAssessments
from utils.api import OrganizationExtractionError, get_user_organization_id

from api.event import RetrieveAllAssessmentsInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveAllAssessments(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = get_user_organization_id(event)

        query_string_parameters = event.get("queryStringParameters")
        task_input = RetrieveAllAssessmentsInput(limit=999999, organization=organization)
        if query_string_parameters:
            task_input.limit = int(query_string_parameters.get("limit", 10))
            task_input.search = query_string_parameters.get("search", None)
            task_input.next_token = query_string_parameters.get("next_token", None)
        response = task.execute(task_input)
        return response.build()
    except OrganizationExtractionError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": str(e)}),
        }
