import json
from typing import Any

import boto3
from entities.question import QuestionDto
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_question import UpdateQuestion

from api.event import UpdateQuestionInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = UpdateQuestion(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = event["requestContext"]["authorizer"]["claims"]["email"].split("@")[1]

        body = json.loads(event["body"])
        question_dto = QuestionDto(**body)
        response = task.execute(
            UpdateQuestionInput(
                assessment_id=event["pathParameters"]["assessmentId"],
                organization=organization,
                pillar_id=event["pathParameters"]["pillarId"],
                question_id=event["pathParameters"]["questionId"],
                question_dto=question_dto,
            ),
        )
        return response.build()
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
