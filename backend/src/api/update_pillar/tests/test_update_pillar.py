from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from entities.question import PillarDto
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import UpdatePillarInput

from ..app.tasks.update_pillar import UpdatePillar


def test_update_pillar():
    assessment = Assessment(
        id="AID",
        name="AN",
        regions=["test-region"],
        role_arn="AR",
        workflows=["test-workflow"],
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
        owner_id="test-owner-id",
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.update_pillar = MagicMock(return_value=True)
    pillar_dto = PillarDto(disabled=False)

    task_input = UpdatePillarInput(assessment_id="AID", pillar_id="PI", pillar_dto=pillar_dto)
    task = UpdatePillar(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assessment_service.update_pillar.assert_called_once_with(assessment, "PI", pillar_dto)
    assert response.status_code == OK
    assert not response.body


def test_update_pillar_not_found():
    assessment = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    pillar_dto = PillarDto(disabled=False)

    task_input = UpdatePillarInput(assessment_id="AID", pillar_id="PI", pillar_dto=pillar_dto)
    task = UpdatePillar(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assert response.status_code == NOT_FOUND
    assert not response.body
