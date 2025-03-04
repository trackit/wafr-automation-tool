from http.client import INTERNAL_SERVER_ERROR
from typing import Any

import boto3
from api.event import RetrieveBestPracticeInput
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_best_practice import RetrieveBestPractice

ddb_resource = boto3.resource("dynamodb")  # type: ignore
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
retrieve_best_practice_task = RetrieveBestPractice(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = retrieve_best_practice_task.execute(
            RetrieveBestPracticeInput(
                id=event["pathParameters"]["assessmentId"],
                bestPractice=event["pathParameters"]["bestPracticeName"],
            )
        )
    except Exception as e:
        return {
            "statusCode": INTERNAL_SERVER_ERROR,
            "body": str(e),
        }
    return response.build()
