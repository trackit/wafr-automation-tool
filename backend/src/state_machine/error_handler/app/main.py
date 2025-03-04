from typing import Any

import boto3
from common.config import (
    REGION,
)
from services.database import DDBService
from services.storage import S3Service
from state_machine.event import StateMachineException
from tasks.error_handler import ErrorHandler

s3_client = boto3.client("s3")  # type: ignore
s3_resource = boto3.resource("s3")  # type: ignore
dynamodb_client = boto3.resource("dynamodb", region_name=REGION)  # type: ignore
storage_service = S3Service(s3_client, s3_resource)
database_service = DDBService(dynamodb_client)
error_handler_task = ErrorHandler(storage_service, database_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> None:
    error_handler_task.execute(StateMachineException(**event))
