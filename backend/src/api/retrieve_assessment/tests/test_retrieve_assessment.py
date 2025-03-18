from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from common.entities import Assessment
from common.enums import STEPS
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RetrieveAssessmentInput

from ..app.tasks.retrieve_assessment import RetrieveAssessment


def test_retrieve_assessment():
    assessment = Assessment(
        id="AID",
        name="AN",
        role_arn="AR",
        step=STEPS.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)

    task_input = RetrieveAssessmentInput(
        assessment_id="AID",
    )
    task = RetrieveAssessment(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assert response.status_code == OK
    assert response.body is not None
    assert response.body.model_dump_json() == assessment.model_dump_json()


def test_retrieve_assessment_not_found():
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=None)

    task_input = RetrieveAssessmentInput(
        assessment_id="AID",
    )
    task = RetrieveAssessment(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assert response.status_code == NOT_FOUND
    assert not response.body
