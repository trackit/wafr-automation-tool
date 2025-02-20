import json
from typing import Any, Union, override

from common.event import FormatProwlerInput
from common.task import Task
from py_ocsf_models.events.findings.detection_finding import DetectionFinding
from types_boto3_s3 import S3Client
from utils.s3 import parse_s3_uri

CHUNK_SIZE = 400


class FormatProwler(Task[FormatProwlerInput, list[list[dict[str, Any]]]]):
    def __init__(
        self,
        s3_client: S3Client,
    ):
        super().__init__()
        self.s3_client = s3_client

    def remove_null_recursively(
        self, obj: Union[dict[str, Any], list[Any], str, int, float, bool, None]
    ) -> Any:
        if isinstance(obj, dict):
            result: dict[str, Any] = {
                k: self.remove_null_recursively(v)
                for k, v in obj.items()
                if v is not None and v != ""
            }
            return {k: v for k, v in result.items() if v}
        elif isinstance(obj, list):
            return [self.remove_null_recursively(v) for v in obj if v is not None]
        else:
            return obj

    def format_content(
        self, json_content: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        findings: list[dict[str, Any]] = []
        for i, item in enumerate(json_content):
            finding = DetectionFinding(**item)
            formatted: dict[str, Any] = {
                "id": i + 1,
                "code": finding.status_code,
                "details": finding.status_detail,
            }
            formatted = self.remove_null_recursively(formatted)
            findings.append(formatted)
        return findings

    def chunk_content(
        self, content: list[dict[str, Any]]
    ) -> list[list[dict[str, Any]]]:
        return [content[i : i + CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)]

    def retrieve_prowler_output(self, prowlerOutput: str) -> list[dict[str, Any]]:
        s3_bucket, s3_key = parse_s3_uri(prowlerOutput)
        response = self.s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
        content = response["Body"].read().decode("utf-8")
        return json.loads(content)

    @override
    def execute(self, event: FormatProwlerInput) -> list[list[dict[str, Any]]]:
        prowler_content = self.retrieve_prowler_output(event.prowler_output)
        formatted_prowler_content = self.format_content(prowler_content)
        return self.chunk_content(formatted_prowler_content)
