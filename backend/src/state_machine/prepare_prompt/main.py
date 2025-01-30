from typing import Any

import boto3
from prowler import create_prowler_prompt

s3_client = boto3.client("s3")

def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    prompts: list[str] = []
    prompts.extend(create_prowler_prompt(s3_client, event["prowlerOutputS3"]))
    return {
        "statusCode": 200,
        "prompts": prompts
    }