from typing import Any

import boto3
from common.event import InvokeLLMInput
from tasks.invoke_llm import InvokeLLM

s3_client = boto3.client("s3")
bedrock_client = boto3.client("bedrock-runtime", region_name="us-west-2")
invoke_llm_task = InvokeLLM(s3_client, bedrock_client)


def lambda_handler(event: dict[str, Any], _context: Any) -> None:
    return invoke_llm_task.execute(InvokeLLMInput(**event))
