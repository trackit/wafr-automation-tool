import urllib.parse
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_best_practice_status import UpdateBestPracticeStatus

from api.event import UpdateBestPracticeStatusInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = UpdateBestPracticeStatus(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    response = task.execute(
        UpdateBestPracticeStatusInput(
            assessment_id=event["pathParameters"]["assessmentId"],
            pillar_id=urllib.parse.unquote(event["pathParameters"]["pillarId"]),
            question_id=urllib.parse.unquote(event["pathParameters"]["questionId"]),
            best_practice_id=urllib.parse.unquote(event["pathParameters"]["bestPracticeId"]),
            status=event["pathParameters"]["status"],
        ),
    )
    return response.build()
