from http.client import INTERNAL_SERVER_ERROR
from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.retrieve_all_assessments import RetrieveAllAssessments

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
retrieve_assessment_task = RetrieveAllAssessments(assessment_service)


def lambda_handler(_event: dict[str, Any], _context: Any) -> dict[str, Any]:
    response = retrieve_assessment_task.execute(None)
    return response.build()
