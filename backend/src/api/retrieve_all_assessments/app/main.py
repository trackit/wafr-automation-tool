from http.client import INTERNAL_SERVER_ERROR
from typing import Any, Dict

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_all_assessments import RetrieveAllAssessments

ddb_resource = boto3.resource("dynamodb")  # type: ignore
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
retrieve_assessment_task = RetrieveAllAssessments(assessment_service)


def lambda_handler(event: Dict[str, Any], _context: Any) -> dict[str, Any]:
    try:
        response = retrieve_assessment_task.execute(None)
    except Exception as e:
        return {
            "statusCode": INTERNAL_SERVER_ERROR,
            "body": str(e),
        }
    return response.build()
