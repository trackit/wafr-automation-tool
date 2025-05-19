import json
from typing import Any

import boto3
from entities.best_practice import BestPracticeDto
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_best_practice import UpdateBestPractice
from utils.api import get_user_organization_id

from api.event import UpdateBestPracticeInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = UpdateBestPractice(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = get_user_organization_id(event)

        body = json.loads(event["body"])
        best_practice_dto = BestPracticeDto(**body)
        response = task.execute(
            UpdateBestPracticeInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                organization=organization,
                pillar_id=event["pathParameters"]["pillarId"],
                question_id=event["pathParameters"]["questionId"],
                best_practice_id=event["pathParameters"]["bestPracticeId"],
                best_practice_dto=best_practice_dto,
            ),
        )
        return response.build()
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
