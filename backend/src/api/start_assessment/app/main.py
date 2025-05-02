import json
from typing import Any

import boto3
from pydantic import ValidationError
from tasks.start_assessment import StartAssessment
from utils.api import UnauthorizedError, get_bearer_token

from api.event import StartAssessmentInput

sfn_client = boto3.client("stepfunctions")
task = StartAssessment(sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        auth_header = get_bearer_token(event)
        body = json.loads(event["body"])

        response = task.execute(StartAssessmentInput(**body, owner_id=auth_header))
        return response.build()

    except UnauthorizedError as e:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": str(e)}),
        }
    except ValidationError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": e.errors()}),
        }
