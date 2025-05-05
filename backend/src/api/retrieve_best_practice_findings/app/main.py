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

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = RetrieveBestPracticeFindings(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

        response = task.execute(
            RetrieveBestPracticeFindingsInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                owner_id=user_id,
                pillar_id=urllib.parse.unquote(event["pathParameters"]["pillarId"]),
                question_id=urllib.parse.unquote(event["pathParameters"]["questionId"]),
                best_practice_id=urllib.parse.unquote(event["pathParameters"]["bestPracticeId"]),
            )
        )
        return response.build()
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
