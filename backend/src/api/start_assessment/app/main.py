import json
from typing import Any

import boto3
from api.event import StartAssessmentInput
from tasks.start_assessment import StartAssessment

sfn_client = boto3.client("stepfunctions")
start_assessment_task = StartAssessment(sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    body = json.loads(event["body"])
    response = start_assessment_task.execute(StartAssessmentInput(**body))
    return response.build()
