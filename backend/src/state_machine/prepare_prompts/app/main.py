from typing import Any

import boto3
from common.config import REGION
from state_machine.event import PreparePromptsInput
from tasks.prepare_prompts import PreparePrompts

s3_client = boto3.client("s3")
dynamodb_client = boto3.resource("dynamodb", region_name=REGION)
prepare_prompts_task = PreparePrompts(s3_client, dynamodb_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> list[str]:
    return prepare_prompts_task.execute(PreparePromptsInput(**event))
