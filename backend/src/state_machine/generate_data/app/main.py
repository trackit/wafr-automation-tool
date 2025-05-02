from typing import Any

import boto3
from services.assessment import AssessmentService
from services.database import DDBService
from tasks.generate_data import GenerateData

from state_machine.event import GenerateDataInput

ddb_resource = boto3.resource("dynamodb")
database_service = DDBService(ddb_resource)
assessment_service = AssessmentService(database_service)
task = GenerateData(assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> None:  # noqa: ANN401
    return task.execute(GenerateDataInput(**event))
