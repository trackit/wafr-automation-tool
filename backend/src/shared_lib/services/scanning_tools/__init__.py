from abc import ABC, abstractmethod

from entities.assessment import AssessmentID
from entities.finding import FindingExtra

from services.storage import IStorageService


class IScanningToolService(ABC):
    def __init__(self, storage_service: IStorageService, name: str, title: str) -> None:
        super().__init__()
        self.name = name
        self.title = title
        self.storage_service = storage_service

    @abstractmethod
    def retrieve_findings(self, assessment_id: AssessmentID) -> list[FindingExtra]:
        raise NotImplementedError
