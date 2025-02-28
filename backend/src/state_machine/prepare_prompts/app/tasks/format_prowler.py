import json
from typing import Any, Type, TypeVar, Union, override

from common.task import Task
from py_ocsf_models.events.findings.detection_finding import DetectionFinding
from state_machine.config import S3_BUCKET, STORE_CHUNK_PATH
from state_machine.event import FormatProwlerInput
from state_machine.findings import ChunkFormat, ChunkFormatForRetrieve
from types_boto3_s3 import S3Client
from utils.s3 import parse_s3_uri

CHUNK_SIZE = 400

FORMAT_TYPE = TypeVar("FORMAT_TYPE", bound=ChunkFormat)


class FormatProwler(Task[FormatProwlerInput, list[list[dict[str, Any]]]]):
    def __init__(
        self,
        s3_client: S3Client,
    ):
        super().__init__()
        self.s3_client = s3_client

    def add_findings_id(self, content: list[dict[str, Any]]) -> list[dict[str, Any]]:
        for i, item in enumerate(content):
            item["id"] = i + 1
        return content

    def retrieve_prowler_output(self, prowlerOutput: str) -> list[dict[str, Any]]:
        s3_bucket, s3_key = parse_s3_uri(prowlerOutput)
        response = self.s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
        content = response["Body"].read().decode("utf-8")
        return self.add_findings_id(json.loads(content))

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

    def format_chunk(
        self, chunk: list[dict[str, Any]], format: Type[FORMAT_TYPE]
    ) -> list[dict[str, Any]]:
        new_chunk: list[dict[str, Any]] = []
        for i, item in enumerate(chunk):
            if not DetectionFinding.validate(item):
                raise ValueError(f"Item {i} is not a DetectionFinding")
            finding = self.remove_null_recursively(item)
            print(finding)
            new_chunk.append(format.parse_obj(finding).dict())
        return new_chunk

    def save_chunk_for_retrieve(
        self, index: int, chunk: list[dict[str, Any]], id: str
    ) -> None:
        retrieve_chunk = self.format_chunk(chunk, ChunkFormatForRetrieve)
        key = STORE_CHUNK_PATH.format(id, index)
        self.s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(retrieve_chunk, separators=(",", ":")),
        )

    def create_chunks(
        self, content: list[dict[str, Any]], id: str
    ) -> list[list[dict[str, Any]]]:
        chunks = [
            content[i : i + CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)
        ]
        for i, chunk in enumerate(chunks):
            self.save_chunk_for_retrieve(i, chunk, id)
            chunks[i] = self.format_chunk(chunk, ChunkFormat)
        return chunks

    @override
    def execute(self, event: FormatProwlerInput) -> list[list[dict[str, Any]]]:
        prowler_content = self.retrieve_prowler_output(event.prowler_output)
        return self.create_chunks(prowler_content, event.id)
