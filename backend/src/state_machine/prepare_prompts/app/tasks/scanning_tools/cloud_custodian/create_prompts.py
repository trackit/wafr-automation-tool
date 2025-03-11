from typing import override

from common.entities import PromptS3Uri
from common.task import CreatePromptsTask
from services.storage import IStorageService
from utils.questions import QuestionSet

from state_machine.event import CreatePromptsInput


class CreateCloudCustodianPrompts(CreatePromptsTask):
    def __init__(self, storage_service: IStorageService, question_set: QuestionSet) -> None:
        super().__init__(storage_service, question_set)

    @override
    def execute(self, event: CreatePromptsInput) -> list[PromptS3Uri]:
        return []
