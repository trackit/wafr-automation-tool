from typing import Any

import boto3
from common.config import S3_BUCKET
from common.event import PreparePromptsInput
from tasks.prepare_prompts import PreparePrompts

s3_client = boto3.client("s3")
prepare_prompts_task = PreparePrompts(s3_client, S3_BUCKET)


def lambda_handler(event: dict[str, Any], _context: Any) -> list[str]:
    return prepare_prompts_task.execute(PreparePromptsInput(**event))
