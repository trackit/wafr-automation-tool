import json
from decimal import Decimal
from typing import Any, Dict

import boto3
from api.event import RetrieveAssessmentInput
from tasks.RetrieveAssessment import RetrieveAssessment

ddb_resource = boto3.resource("dynamodb")
retrieve_assessment_task = RetrieveAssessment(ddb_resource)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any):
        if isinstance(o, Decimal):
            return int(o)
        return super(DecimalEncoder, self).default(o)


def lambda_handler(event: Dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = retrieve_assessment_task.execute(
            RetrieveAssessmentInput(id=event["pathParameters"]["assessmentId"])
        )
        print(response)
    except Exception as e:
        return {
            "statusCode": 400,
            "body": str(e),
        }
    return {
        "statusCode": 200,
        "body": json.dumps(response.dict(), cls=DecimalEncoder) if response else None,
    }
