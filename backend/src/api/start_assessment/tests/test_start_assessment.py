from unittest.mock import MagicMock

from api.event import StartAssessmentInput, StartAssessmentResponseBody

from ..app.tasks.start_assessment import StartAssessment


def test_start_assessment():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": 200}})

    task_input = StartAssessmentInput(name="NAME", role="ROLE")
    task = StartAssessment(sfn_client)
    task.generate_assessment_id = MagicMock(return_value="ID")
    reponse = task.execute(task_input)

    task.generate_assessment_id.assert_called_once()
    sfn_client.start_execution.assert_called_once()
    assert reponse.status_code == 200
    assert reponse.body == StartAssessmentResponseBody(assessmentId="ID")
