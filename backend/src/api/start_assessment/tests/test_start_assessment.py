from http.client import INTERNAL_SERVER_ERROR, OK
from unittest.mock import MagicMock

from api.event import StartAssessmentInput, StartAssessmentResponseBody

from ..app.tasks.start_assessment import StartAssessment


def test_start_assessment():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": OK}})

    task_input = StartAssessmentInput(name="NAME", role="ROLE")
    task = StartAssessment(sfn_client)
    task.generate_assessment_id = MagicMock(return_value="ID")
    response = task.execute(task_input)

    task.generate_assessment_id.assert_called_once()
    sfn_client.start_execution.assert_called_once()
    assert response.status_code == OK
    assert response.body == StartAssessmentResponseBody(assessmentId="ID")


def test_start_assessment_internal_error():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": INTERNAL_SERVER_ERROR}})

    task_input = StartAssessmentInput(name="NAME", role="ROLE")
    task = StartAssessment(sfn_client)
    response = task.execute(task_input)

    sfn_client.start_execution.assert_called_once()
    assert response.status_code == INTERNAL_SERVER_ERROR
    assert not response.body
