import json
from typing import Any

import boto3
from pydantic import ValidationError
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.update_assessment import UpdateAssessment
from utils.api import UnauthorizedError, get_bearer_token

from api.event import UpdateAssessmentInput
from entities.assessment import AssessmentDto

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = UpdateAssessment(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
   try:
       auth_header = get_bearer_token(event)
       body = json.loads(event["body"])
       assessement_dto = AssessmentDto(**body)
       response = task.execute(
           UpdateAssessmentInput(
               assessment_id=event["pathParameters"]["assessmentId"], assessment_dto=assessement_dto, owner_id=auth_header
           ),
       )
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
