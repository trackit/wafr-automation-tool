from http.client import INTERNAL_SERVER_ERROR
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.delete_assessment import DeleteAssessment

from api.event import DeleteAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
delete_assessments_task = DeleteAssessment(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    response = delete_assessments_task.execute(
        DeleteAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"]),
    )
    return response.build()
