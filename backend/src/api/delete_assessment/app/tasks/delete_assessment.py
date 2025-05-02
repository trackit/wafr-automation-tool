from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from entities.assessment import Assessment
from services.assessment import IAssessmentService
from types_boto3_stepfunctions import SFNClient
from utils.api import APIResponse

from api.event import DeleteAssessmentInput


class DeleteAssessment(Task[DeleteAssessmentInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService, sfn_client: SFNClient) -> None:
        super().__init__()
        self.assessment_service = assessment_service
        self.sfn_client = sfn_client

    def cancel_step_functions(self, assessment: Assessment) -> None:
        if not assessment.execution_arn:
            return
        self.sfn_client.stop_execution(
            executionArn=assessment.execution_arn,
            cause="User requested cancellation",
        )

    @override
    def execute(self, event: DeleteAssessmentInput) -> APIResponse[None]:
        assessment = self.assessment_service.retrieve(
            assessment_id=event.assessment_id,
            owner_id=event.owner_id,
        )
        if not assessment:
            return APIResponse(status_code=NOT_FOUND, body=None)
        self.assessment_service.delete_findings(assessment)
        self.assessment_service.delete(event.assessment_id)
        self.cancel_step_functions(assessment)
        return APIResponse(
            status_code=OK,
            body=None,
        )
