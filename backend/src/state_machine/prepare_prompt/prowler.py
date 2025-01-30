import json
from typing import Any, Union

from py_ocsf_models.events.findings.detection_finding import DetectionFinding
from types_boto3_s3 import S3Client
from utils import parse_s3_uri

CHUNK_SIZE = 2000

def remove_null_recursively(obj: Union[dict[str, Any], list[Any], str, int, float, bool, None]) -> Any:
    if isinstance(obj, dict):
        result: dict[str, Any] = {
            k: remove_null_recursively(v)
            for k, v in obj.items()
            if v is not None and v != ""
        }
        return {k: v for k, v in result.items() if v}
    elif isinstance(obj, list):
        return [
            remove_null_recursively(v)
            for v in obj
            if v is not None
        ]
    else:
        return obj

def format_content(json_content: list[dict[str, Any]]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for i, item in enumerate(json_content):
        finding = DetectionFinding(**item)
        formatted: dict[str, Any] = {
            "id": i + 1,
            "code": finding.status_code,
            "details": finding.status_detail,
        }
        formatted = remove_null_recursively(formatted)
        findings.append(formatted)
    return findings

def chunk_content(content: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    return [content[i:i + CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)]

def create_prompt(chunk: list[dict[str, Any]]) -> str:
    with open("prompt.txt", "r") as f:
        prompt = f.read()
    prompt += "\n" + json.dumps(chunk, separators=(',', ':'))
    return prompt

def create_prowler_prompt(s3_client: S3Client, s3_uri: str) -> list[str]:
    s3_bucket, s3_key = parse_s3_uri(s3_uri)
    response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
    content = response["Body"].read().decode("utf-8")
    json_content = json.loads(content)
    formatted_content = format_content(json_content)
    chunks = chunk_content(formatted_content)

    prompts: list[str] = []
    for i, chunk in enumerate(chunks):
        prompts.append(f"s3://{s3_bucket}/prompts/chunk_{i}.txt")
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=f"prompts/chunk_{i}.txt",
            Body=create_prompt(chunk),
        );
    return prompts