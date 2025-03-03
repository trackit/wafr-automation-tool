import time
from http.client import INTERNAL_SERVER_ERROR, OK
from typing import override

from api.config import STATE_MACHINE_ARN
from api.event import (
    StartAssessmentInput,
    StartAssessmentResponseBody,
    StateMachineInput,
)
from common.task import Task
from types_boto3_stepfunctions import SFNClient
from utils.api import APIResponse


class StartAssessment(
    Task[StartAssessmentInput, APIResponse[StartAssessmentResponseBody]]
):
    def __init__(self, sfn_client: SFNClient) -> None:
        self.sfn_client = sfn_client

    def generate_assessment_id(self) -> str:
        return str(int(time.time() * 1000))

    def start_step_functions(
        self, assessment_id: str, event: StartAssessmentInput
    ) -> bool:
        input_json = StateMachineInput(
            id=assessment_id,
            name=event.name,
            role=event.role,
        )
        response = self.sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            input=input_json.json(),
        )
        return response.get("ResponseMetadata").get("HTTPStatusCode") == OK

    @override
    def execute(
        self, event: StartAssessmentInput
    ) -> APIResponse[StartAssessmentResponseBody]:
        assessment_id = self.generate_assessment_id()
        step_function_response = self.start_step_functions(assessment_id, event)

        if not step_function_response:
            return APIResponse(
                statusCode=INTERNAL_SERVER_ERROR,
                body=None,
            )
        return APIResponse(
            statusCode=OK, body=StartAssessmentResponseBody(assessmentId=assessment_id)
        )
