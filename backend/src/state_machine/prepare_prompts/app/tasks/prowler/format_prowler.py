import json
from typing import Any, Type, TypeVar, Union, override

from common.config import S3_BUCKET, STORE_CHUNK_PATH
from common.entities import Finding, FindingExtra
from common.task import Task
from py_ocsf_models.events.findings.detection_finding import DetectionFinding
from services.storage import IStorageService
from state_machine.event import FormatProwlerInput

CHUNK_SIZE = 400

FORMAT_TYPE = TypeVar("FORMAT_TYPE", bound=Finding)


class FormatProwler(Task[FormatProwlerInput, list[list[dict[str, Any]]]]):
    def __init__(
        self,
        storage_service: IStorageService,
    ):
        super().__init__()
        self.storage_service = storage_service

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
            new_chunk.append(format.parse_obj(finding).dict())
        return new_chunk

    def save_chunk_for_retrieve(
        self, index: int, chunk: list[dict[str, Any]], id: str
    ) -> None:
        retrieve_chunk = self.format_chunk(chunk, FindingExtra)
        key = STORE_CHUNK_PATH.format(id, index)
        self.storage_service.put(
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
            chunks[i] = self.format_chunk(chunk, Finding)
        return chunks

    @override
    def execute(self, event: FormatProwlerInput) -> list[list[dict[str, Any]]]:
        return self.create_chunks(event.prowler_output, event.id)
