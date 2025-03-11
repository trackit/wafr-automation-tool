from typing import Any

import boto3
from services.storage import S3Service
from tasks.prepare_custodian import PrepareCustodian

s3_client = boto3.client("s3")
s3_resource = boto3.resource("s3")
storage_service = S3Service(s3_client, s3_resource)
task = PrepareCustodian(storage_service)


def lambda_handler(_event: dict[str, Any], _context: Any) -> str:  # noqa: ANN401
    return task.execute(None)
