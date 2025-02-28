import json
from typing import Any

import boto3
from api.event import StartAssessmentInput
from tasks.StartAssessment import StartAssessment

sfn_client = boto3.client("stepfunctions")
start_assessment_task = StartAssessment(sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    body = json.loads(event["body"])
    reponse = start_assessment_task.execute(StartAssessmentInput(**body))
    return {
        "statusCode": reponse.statusCode,
        "body": json.dumps(reponse.body.dict()) if reponse.body else None,
    }
