from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_finding_hide import UpdateFindingHide

from api.event import UpdateFindingHideInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = UpdateFindingHide(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    response = task.execute(
        UpdateFindingHideInput(
            assessment_id=event["pathParameters"]["assessmentId"],
            pillar_id=event["pathParameters"]["pillarId"],
            question_id=event["pathParameters"]["questionId"],
            best_practice_id=event["pathParameters"]["bestPracticeId"],
            finding_id=event["pathParameters"]["findingId"],
            hide=event["pathParameters"]["hide"],
        ),
    )
    return response.build()
