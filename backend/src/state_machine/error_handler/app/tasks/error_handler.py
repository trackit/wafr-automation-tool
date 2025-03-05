from typing import override

from common.config import (
    PROWLER_COMPLIANCE_PATH,
    PROWLER_OCSF_PATH,
    S3_BUCKET,
)
from common.entities import AssessmentDto
from common.task import Task
from services.assessment import IAssessmentService
from services.database import IDatabaseService
from services.storage import IStorageService

from state_machine.event import StateMachineException


class ErrorHandler(Task[StateMachineException, None]):
    def __init__(
        self,
        storage_service: IStorageService,
        database_service: IDatabaseService,
        assessment_service: IAssessmentService,
    ) -> None:
        super().__init__()
        self.storage_service = storage_service
        self.database_service = database_service
        self.assessment_service = assessment_service

    def update_assessment_item(self, exception: StateMachineException) -> None:
        assessment_dto = AssessmentDto(
            step=-1,
        )
        self.assessment_service.update(exception.assessment_id, assessment_dto)

    def clean_prowler_scan(self, exception: StateMachineException) -> None:
        prowler_key = PROWLER_OCSF_PATH.format(exception.assessment_id)
        prowler_compliance_key = PROWLER_COMPLIANCE_PATH.format(exception.assessment_id)
        self.storage_service.delete(Bucket=S3_BUCKET, Key=prowler_key)

        compliance_objects = self.storage_service.filter(
            S3_BUCKET,
            prowler_compliance_key,
        )
        self.storage_service.bulk_delete(S3_BUCKET, compliance_objects)

    def clean_assessment_storage(self, exception: StateMachineException) -> None:
        objects = self.storage_service.filter(S3_BUCKET, str(exception.assessment_id))
        self.storage_service.bulk_delete(S3_BUCKET, objects)

    def clean_assessment(self, exception: StateMachineException) -> None:
        self.assessment_service.delete_findings(exception.assessment_id)
        self.clean_assessment_storage(exception)

    @override
    def execute(self, event: StateMachineException) -> None:
        self.update_assessment_item(event)
        self.clean_prowler_scan(event)
        self.clean_assessment(event)
