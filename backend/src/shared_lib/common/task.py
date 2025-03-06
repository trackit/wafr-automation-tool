from abc import ABC, abstractmethod

from services.storage import IStorageService
from utils.questions import QuestionSet

from common.entities import PromptS3Uri
from state_machine.event import CreatePromptsInput


class Task[T, U](ABC):
    @abstractmethod
    def execute(self, event: T) -> U:
        raise NotImplementedError


class CreatePromptsTask(Task[CreatePromptsInput, list[PromptS3Uri]], ABC):
    def __init__(self, storage_service: IStorageService, question_set: QuestionSet) -> None:
        super().__init__()
        self.storage_service = storage_service
        self.question_set = question_set
