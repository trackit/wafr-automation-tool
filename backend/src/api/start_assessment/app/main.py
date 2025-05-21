import json
from http.client import BAD_REQUEST
from typing import Any

import boto3
from pydantic import ValidationError
from tasks.start_assessment import StartAssessment
from utils.api import OrganizationExtractionError, UserIdExtractionError, get_user_id, get_user_organization_id

from api.event import StartAssessmentInput

sfn_client = boto3.client("stepfunctions")
task = StartAssessment(sfn_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:  # noqa: ANN401
    try:
        organization = get_user_organization_id(event)

        user_id = get_user_id(event)

        body = json.loads(event["body"])

        response = task.execute(StartAssessmentInput(**body, created_by=user_id, organization=organization))
        return response.build()
    except OrganizationExtractionError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": str(e)}),
        }
    except UserIdExtractionError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": str(e)}),
        }
    except ValidationError as e:
        return {
            "statusCode": BAD_REQUEST,
            "body": json.dumps({"error": e.errors()}),
        }
