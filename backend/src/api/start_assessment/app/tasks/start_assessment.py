import datetime
import time
from http.client import INTERNAL_SERVER_ERROR, OK
from typing import override

from common.config import STATE_MACHINE_ARN
from common.task import Task
from entities.assessment import AssessmentID
from types_boto3_stepfunctions import SFNClient
from utils.api import APIResponse

from api.config import DEFAULT_ASSESSMENT_ROLE
from api.event import (
    StartAssessmentInput,
    StartAssessmentResponseBody,
    StateMachineInput,
)


class StartAssessment(
    Task[StartAssessmentInput, APIResponse[StartAssessmentResponseBody]],
):
    def __init__(self, sfn_client: SFNClient) -> None:
        super().__init__()
        self.sfn_client = sfn_client

    def generate_assessment_id(self) -> str:
        return str(int(time.time() * 1000))

    def start_step_functions(
        self,
        assessment_id: AssessmentID,
        event: StartAssessmentInput,
    ) -> bool:
        role_arn = event.roleArn if event.roleArn else DEFAULT_ASSESSMENT_ROLE
        input_json = StateMachineInput(
            assessment_id=assessment_id,
            name=event.name,
            regions=event.regions if event.regions else [],
            role_arn=role_arn,
            workflow=event.workflow if event.workflow else "",
            created_at=datetime.datetime.now(datetime.UTC).isoformat(),
        )
        response = self.sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            input=input_json.model_dump_json(),
        )
        return response.get("ResponseMetadata").get("HTTPStatusCode") == OK

    @override
    def execute(
        self,
        event: StartAssessmentInput,
    ) -> APIResponse[StartAssessmentResponseBody]:
        assessment_id = self.generate_assessment_id()
        step_function_response = self.start_step_functions(assessment_id, event)

        if not step_function_response:
            return APIResponse(
                status_code=INTERNAL_SERVER_ERROR,
                body=None,
            )
        return APIResponse(
            status_code=OK,
            body=StartAssessmentResponseBody(assessmentId=assessment_id),
        )
