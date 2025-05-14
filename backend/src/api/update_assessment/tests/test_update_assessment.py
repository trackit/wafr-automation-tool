from http.client import OK
from unittest.mock import MagicMock

from entities.assessment import AssessmentDto
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import UpdateAssessmentInput

from ..app.tasks.update_assessment import UpdateAssessment


def test_update_assessment():
    assessment_service = FakeAssessmentService()
    assessment_service.update_assessment = MagicMock(return_value=True)
    assessment_dto = AssessmentDto(
        name="AN",
    )

    task_input = UpdateAssessmentInput(assessment_id="AID", created_by="test-created-by", assessment_dto=assessment_dto)
    task = UpdateAssessment(assessment_service)
    response = task.execute(task_input)

    assessment_service.update_assessment.assert_called_once_with(
        assessment_id="AID", created_by="test-created-by", assessment_dto=AssessmentDto(name="AN")
    )
    assert response.status_code == OK
    assert not response.body
