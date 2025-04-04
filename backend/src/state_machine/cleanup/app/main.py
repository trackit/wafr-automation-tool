from typing import Any

import boto3
from common.config import (
    REGION,
)
from services.assessment import AssessmentService
from services.database import DDBService
from services.storage import S3Service
from tasks.cleanup import Cleanup

from state_machine.event import CleanupInput

s3_client = boto3.client("s3")
s3_resource = boto3.resource("s3")
dynamodb_client = boto3.resource("dynamodb", region_name=REGION)
storage_service = S3Service(s3_client, s3_resource)
database_service = DDBService(dynamodb_client)
assessment_service = AssessmentService(database_service)
task = Cleanup(storage_service, database_service, assessment_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> None:  # noqa: ANN401
    task.execute(CleanupInput(**event))
