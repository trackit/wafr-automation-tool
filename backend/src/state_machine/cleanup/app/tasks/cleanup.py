from typing import override

from common.config import (
    DEBUG,
    PROWLER_COMPLIANCE_PATH,
    PROWLER_OCSF_PATH,
    S3_BUCKET,
    STEP_ERROR,
)
from common.entities import AssessmentDto
from common.task import Task
from services.assessment import IAssessmentService
from services.database import IDatabaseService
from services.storage import IStorageService

from state_machine.event import CleanupInput


class Cleanup(Task[CleanupInput, None]):
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

    def clean_prowler_scan(self, event: CleanupInput) -> None:
        prowler_key = PROWLER_OCSF_PATH.format(event.assessment_id)
        prowler_compliance_key = PROWLER_COMPLIANCE_PATH.format(event.assessment_id)
        self.storage_service.delete(Bucket=S3_BUCKET, Key=prowler_key)

        compliance_objects = self.storage_service.filter(
            S3_BUCKET,
            prowler_compliance_key,
        )
        self.storage_service.bulk_delete(S3_BUCKET, [obj.key for obj in compliance_objects])

    def clean_assessment_storage(self, event: CleanupInput) -> None:
        objects = self.storage_service.filter(S3_BUCKET, str(event.assessment_id))
        self.storage_service.bulk_delete(S3_BUCKET, [obj.key for obj in objects])

    def update_assessment_item(self, event: CleanupInput) -> None:
        error = event.error
        if error is not None:
            error = error.model_dump()
        assessment_dto = AssessmentDto(
            step=STEP_ERROR,
            error=error,
        )
        self.assessment_service.update(event.assessment_id, assessment_dto)

    @override
    def execute(self, event: CleanupInput) -> None:
        if not DEBUG:
            self.clean_prowler_scan(event)
            self.clean_assessment_storage(event)
        if event.error:
            if not DEBUG:
                self.assessment_service.delete_findings(event.assessment_id)
            self.update_assessment_item(event)
