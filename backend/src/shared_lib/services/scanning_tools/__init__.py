from abc import ABC, abstractmethod

from common.entities import FindingExtra
from pydantic import BaseModel

from services.storage import IStorageService


class IScanningToolService(ABC, BaseModel):
    name: str
    title: str

    def __init__(self, storage_service: IStorageService, name: str | None = None, title: str | None = None) -> None:
        super().__init__(name=name, title=title)
        self.storage_service = storage_service

    @abstractmethod
    def retrieve_findings(self, assessment_id: str) -> list[FindingExtra]:
        raise NotImplementedError
