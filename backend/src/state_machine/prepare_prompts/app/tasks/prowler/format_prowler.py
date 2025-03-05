import json
from typing import Any, TypeVar, override

from common.config import S3_BUCKET, STORE_CHUNK_PATH
from common.entities import Finding, FindingExtra
from common.task import Task
from exceptions.prowler import NotDetectionFindingError
from py_ocsf_models.events.findings.detection_finding import DetectionFinding
from services.storage import IStorageService

from state_machine.event import FormatProwlerInput

CHUNK_SIZE = 400

FORMAT_TYPE = TypeVar("FORMAT_TYPE", bound=Finding)


class FormatProwler(Task[FormatProwlerInput, list[list[dict[str, Any]]]]):
    def __init__(
        self,
        storage_service: IStorageService,
    ) -> None:
        super().__init__()
        self.storage_service = storage_service

    def remove_null_recursively(
        self,
        obj: dict[str, Any] | list[Any] | str | float | bool | None,
    ) -> Any:
        if isinstance(obj, dict):
            result: dict[str, Any] = {
                k: self.remove_null_recursively(v) for k, v in obj.items() if v is not None and v != ""
            }
            return {k: v for k, v in result.items() if v}
        if isinstance(obj, list):
            return [self.remove_null_recursively(v) for v in obj if v is not None]
        return obj

    def format_chunk(
        self,
        chunk: list[dict[str, Any]],
        schema_type: type[FORMAT_TYPE],
    ) -> list[dict[str, Any]]:
        new_chunk: list[dict[str, Any]] = []
        for i, item in enumerate(chunk):
            if not DetectionFinding.validate(item):
                raise NotDetectionFindingError(i)
            finding = self.remove_null_recursively(item)
            new_chunk.append(schema_type.parse_obj(finding).dict())
        return new_chunk

    def save_chunk_for_retrieve(
        self,
        assessment_id: str,
        chunk_id: int,
        chunk: list[dict[str, Any]],
    ) -> None:
        retrieve_chunk = self.format_chunk(chunk, FindingExtra)
        key = STORE_CHUNK_PATH.format(assessment_id, chunk_id)
        self.storage_service.put(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(retrieve_chunk, separators=(",", ":")),
        )

    def create_chunks(
        self,
        assessment_id: str,
        content: list[dict[str, Any]],
    ) -> list[list[dict[str, Any]]]:
        chunks = [content[i : i + CHUNK_SIZE] for i in range(0, len(content), CHUNK_SIZE)]
        for i, chunk in enumerate(chunks):
            self.save_chunk_for_retrieve(assessment_id, i, chunk)
            chunks[i] = self.format_chunk(chunk, Finding)
        return chunks

    @override
    def execute(self, event: FormatProwlerInput) -> list[list[dict[str, Any]]]:
        return self.create_chunks(event.assessment_id, event.prowler_output)
