import json
import urllib.parse
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_best_practice_findings import (
    RetrieveBestPracticeFindings,
)

from api.event import RetrieveBestPracticeFindingsInput
from utils.api import UnauthorizedError, get_bearer_token

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveBestPracticeFindings(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        auth_header = get_bearer_token(event)

        response = task.execute(
            RetrieveBestPracticeFindingsInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                pillar_id=urllib.parse.unquote(event["pathParameters"]["pillarId"]),
                question_id=urllib.parse.unquote(event["pathParameters"]["questionId"]),
                best_practice_id=urllib.parse.unquote(event["pathParameters"]["bestPracticeId"]),
                owner_id=auth_header
            )
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