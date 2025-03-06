import json
from typing import Any, TypeVar, override

from common.config import S3_BUCKET, STORE_CHUNK_PATH
from common.entities import Finding, FindingExtra
from common.task import Task
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

    def format_chunk(
        self,
        chunk: list[dict[str, Any]],
        schema_type: type[FORMAT_TYPE],
    ) -> list[dict[str, Any]]:
        new_chunk: list[dict[str, Any]] = []
        for item in chunk:
            finding = schema_type(**item)
            new_chunk.append(finding.model_dump(exclude_none=True))
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
