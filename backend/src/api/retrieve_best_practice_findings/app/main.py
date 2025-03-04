from http.client import INTERNAL_SERVER_ERROR
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_best_practice_findings import (
    RetrieveBestPracticeFindings,
)

from api.event import RetrieveBestPracticeFindingsInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
retrieve_best_practice_findings_task = RetrieveBestPracticeFindings(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = retrieve_best_practice_findings_task.execute(
            RetrieveBestPracticeFindingsInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                best_practice=event["pathParameters"]["bestPracticeName"],
            )
        )
    except Exception as e:
        return {
            "statusCode": INTERNAL_SERVER_ERROR,
            "body": str(e),
        }
    return response.build()
