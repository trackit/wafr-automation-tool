from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from entities.best_practice import BestPracticeDto
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import UpdateBestPracticeInput

from ..app.tasks.update_best_practice import UpdateBestPractice


def test_update_best_practice():
    assessment = Assessment(
        id="AID",
        owner_id="test-owner-id",
        name="AN",
        regions=["test-region"],
        role_arn="AR",
        workflows=["test-workflow"],
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.update_best_practice = MagicMock(return_value=True)
    best_practice_dto = BestPracticeDto(status=True)

    task_input = UpdateBestPracticeInput(
        assessment_id="AID",
        owner_id="test-owner-id",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
        best_practice_dto=best_practice_dto,
    )
    task = UpdateBestPractice(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-owner-id")
    assessment_service.update_best_practice.assert_called_once_with(assessment, "PI", "QI", "BP", best_practice_dto)
    assert response.status_code == OK
    assert not response.body


def test_update_best_practice_not_found():
    assessment = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.update_best_practice = MagicMock(return_value=True)
    best_practice_dto = BestPracticeDto(status=True)

    task_input = UpdateBestPracticeInput(
        assessment_id="AID",
        owner_id="test-owner-id",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
        best_practice_dto=best_practice_dto,
    )
    task = UpdateBestPractice(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-owner-id")
    assert response.status_code == NOT_FOUND
    assert not response.body
