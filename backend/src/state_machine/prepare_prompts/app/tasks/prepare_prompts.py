from typing import Any, override

from common.config import (
    ASSESSMENT_PK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
)
from common.task import Task
from exceptions.scanning_tool import InvalidScanningToolError
from services.database import IDatabaseService
from services.prompt import IPromptService
from services.scanning_tools.list import SCANNING_TOOL_SERVICES
from services.storage import IStorageService
from utils.questions import QuestionSet

from state_machine.event import PreparePromptsInput


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        question_set: QuestionSet,
        prompt_service: IPromptService,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.question_set = question_set
        self.prompt_service = prompt_service

    def populate_dynamodb(self, assessment_id: str) -> None:
        attrs: dict[str, Any] = {"findings": self.question_set.data, "question_version": self.question_set.version}
        self.database_service.update_attrs(
            table_name=DDB_TABLE,
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            attrs=attrs,
        )

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        scanning_tool_service_type = SCANNING_TOOL_SERVICES.get(event.scanning_tool)
        if scanning_tool_service_type is None:
            raise InvalidScanningToolError(event.scanning_tool)

        self.populate_dynamodb(event.assessment_id)
        scanning_tool_service = scanning_tool_service_type(self.storage_service)
        return self.prompt_service.create_prompts(scanning_tool_service, event.assessment_id)
