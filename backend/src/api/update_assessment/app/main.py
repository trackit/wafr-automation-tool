import json
from typing import Any

import boto3
from common.entities import AssessmentDto
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_assessment import UpdateAssessment

from api.event import UpdateAssessmentInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
delete_assessments_task = UpdateAssessment(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    body = json.loads(event["body"])
    assessement_dto = AssessmentDto(**body)
    response = delete_assessments_task.execute(
        UpdateAssessmentInput(assessment_id=event["pathParameters"]["assessmentId"], assessment_dto=assessement_dto),
    )
    return response.build()
