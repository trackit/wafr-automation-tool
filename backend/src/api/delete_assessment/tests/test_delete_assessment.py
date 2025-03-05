from unittest.mock import MagicMock

from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import DeleteAssessmentInput

from ..app.tasks.delete_assessment import DeleteAssessment


def test_delete_assessment():
    assessment_service = FakeAssessmentService()
    assessment_service.delete = MagicMock(return_value=True)
    assessment_service.delete_findings = MagicMock(return_value=True)

    task_input = DeleteAssessmentInput(assessment_id="AID")
    task = DeleteAssessment(assessment_service)
    response = task.execute(task_input)

    assessment_service.delete.assert_called_once_with("AID")
    assessment_service.delete_findings.assert_called_once_with("AID")
    assert response.status_code == 200
    assert not response.body
