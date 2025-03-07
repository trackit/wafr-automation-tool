from typing import Any, override

from common.config import (
    ASSESSMENT_PK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
)
from common.entities import ScanningTool
from common.task import CreatePromptsTask, Task
from exceptions.scanning_tool import InvalidScanningToolError
from services.database import IDatabaseService
from services.storage import IStorageService
from tasks.scanning_tools.prowler.create_prompts import CreateProwlerPrompts
from utils.questions import QuestionSet

from state_machine.event import CreatePromptsInput, PreparePromptsInput

SCANNING_TOOL_TASK: dict[str, type[CreatePromptsTask]] = {
    ScanningTool.PROWLER: CreateProwlerPrompts,
}


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        question_set: QuestionSet,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.question_set = question_set

    def populate_dynamodb(self, assessment_id: str) -> None:
        attrs: dict[str, Any] = {"findings": self.question_set.data, "question_version": self.question_set.version}
        self.database_service.update_attrs(
            table_name=DDB_TABLE,
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            attrs=attrs,
        )

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        scanning_tool_task = SCANNING_TOOL_TASK.get(event.scanning_tool)
        if scanning_tool_task is None:
            raise InvalidScanningToolError(event.scanning_tool)

        self.populate_dynamodb(event.assessment_id)
        task = scanning_tool_task(self.storage_service, self.question_set)
        return task.execute(CreatePromptsInput(assessment_id=event.assessment_id, scanning_tool=event.scanning_tool))
