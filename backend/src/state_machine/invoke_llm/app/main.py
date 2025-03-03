from typing import Any

import boto3
from common.config import REGION
from state_machine.event import InvokeLLMInput
from tasks.invoke_llm import InvokeLLM

s3_client = boto3.client("s3")
dynamodb_client = boto3.resource("dynamodb", region_name=REGION)
bedrock_client = boto3.client("bedrock-runtime", region_name=REGION)
invoke_llm_task = InvokeLLM(s3_client, bedrock_client, dynamodb_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> None:
    return invoke_llm_task.execute(InvokeLLMInput(**event))
