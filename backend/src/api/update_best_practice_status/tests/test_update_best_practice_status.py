from http.client import OK
from unittest.mock import MagicMock

from common.entities import Assessment
from common.enums import Steps
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import UpdateBestPracticeStatusInput

from ..app.tasks.update_best_practice_status import UpdateBestPracticeStatus


def test_update_best_practice_status():
    assessment = Assessment(
        id="AID",
        name="AN",
        role_arn="AR",
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.update_best_practice = MagicMock(return_value=True)

    task_input = UpdateBestPracticeStatusInput(assessment_id="AID", best_practice_name="BP", status=True)
    task = UpdateBestPracticeStatus(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assessment_service.update_best_practice.assert_called_once_with(assessment, "BP", True)  # noqa: FBT003
    assert response.status_code == OK
    assert not response.body
