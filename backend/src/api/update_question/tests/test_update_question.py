from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from entities.question import QuestionDto
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import UpdateQuestionInput

from ..app.tasks.update_question import UpdateQuestion


def test_update_question():
    assessment = Assessment(
        id="AID",
        name="AN",
        regions=["test-region"],
        role_arn="AR",
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.update_question = MagicMock(return_value=True)
    question_dto = QuestionDto(none=True)

    task_input = UpdateQuestionInput(assessment_id="AID", pillar_id="PI", question_id="QI", question_dto=question_dto)
    task = UpdateQuestion(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assessment_service.update_question.assert_called_once_with(assessment, "PI", "QI", question_dto)
    assert response.status_code == OK
    assert not response.body


def test_update_question_not_found():
    assessment = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    question_dto = QuestionDto(none=True)

    task_input = UpdateQuestionInput(assessment_id="AID", pillar_id="PI", question_id="QI", question_dto=question_dto)
    task = UpdateQuestion(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assert response.status_code == NOT_FOUND
    assert not response.body
