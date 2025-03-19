from http.client import INTERNAL_SERVER_ERROR, OK
from unittest.mock import MagicMock

from common.config import STATE_MACHINE_ARN
from freezegun import freeze_time

from api.event import StartAssessmentInput, StartAssessmentResponseBody

from ..app.tasks.start_assessment import StartAssessment


def test_start_assessment():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": OK}})

    task_input = StartAssessmentInput(name="NAME", roleArn="ROLE")
    task = StartAssessment(sfn_client)
    task.generate_assessment_id = MagicMock(return_value="ID")
    response = task.execute(task_input)

    task.generate_assessment_id.assert_called_once()
    sfn_client.start_execution.assert_called_once()
    assert response.status_code == OK
    assert response.body == StartAssessmentResponseBody(assessmentId="ID")


@freeze_time("2000-01-01T00:00:00.000000+00:00")
def test_start_assessment_with_default_role():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": OK}})

    task_input = StartAssessmentInput(name="NAME")
    task = StartAssessment(sfn_client)
    task.generate_assessment_id = MagicMock(return_value="ID")
    response = task.execute(task_input)

    task.generate_assessment_id.assert_called_once()
    sfn_client.start_execution.assert_called_once_with(
        stateMachineArn=STATE_MACHINE_ARN,
        input='{"assessment_id":"ID","name":"NAME","role_arn":"test-role","created_at":"2000-01-01T00:00:00+00:00"}',
    )
    assert response.status_code == OK
    assert response.body == StartAssessmentResponseBody(assessmentId="ID")


def test_start_assessment_internal_error():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": INTERNAL_SERVER_ERROR}})

    task_input = StartAssessmentInput(name="NAME", roleArn="ROLE")
    task = StartAssessment(sfn_client)
    response = task.execute(task_input)

    sfn_client.start_execution.assert_called_once()
    assert response.status_code == INTERNAL_SERVER_ERROR
    assert not response.body
