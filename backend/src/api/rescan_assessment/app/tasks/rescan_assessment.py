import datetime
from http.client import INTERNAL_SERVER_ERROR, NOT_FOUND, OK
from typing import override

from common.config import STATE_MACHINE_ARN
from common.task import Task
from entities.assessment import Assessment
from services.assessment import IAssessmentService
from types_boto3_stepfunctions import SFNClient
from utils.api import APIResponse

from api.event import RescanAssessmentInput, StateMachineInput


class RescanAssessment(
    Task[RescanAssessmentInput, APIResponse[None]],
):
    def __init__(self, assessment_service: IAssessmentService, sfn_client: SFNClient) -> None:
        super().__init__()
        self.assessment_service = assessment_service
        self.sfn_client = sfn_client

    def start_step_functions(self, assessment: Assessment) -> bool:
        input_json = StateMachineInput(
            assessment_id=assessment.id,
            name=assessment.name,
            regions=assessment.regions,
            role_arn=assessment.role_arn,
            workflows=assessment.workflows,
            created_at=datetime.datetime.now(datetime.UTC).isoformat(),
            owner_id=assessment.owner_id,
        )
        response = self.sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            input=input_json.model_dump_json(),
        )
        return response.get("ResponseMetadata").get("HTTPStatusCode") == OK

    def clean_assessment(self, assessment: Assessment) -> None:
        self.assessment_service.delete_findings(assessment)
        self.assessment_service.delete(assessment.id)

    @override
    def execute(
        self,
        event: RescanAssessmentInput,
    ) -> APIResponse[None]:
        assessment = self.assessment_service.retrieve(event.assessment_id, "123")  # temporaire
        if not assessment:
            return APIResponse(status_code=NOT_FOUND, body=None)
        self.clean_assessment(assessment)
        if not self.start_step_functions(assessment):
            return APIResponse(status_code=INTERNAL_SERVER_ERROR, body=None)
        return APIResponse(
            status_code=OK,
            body=None,
        )
