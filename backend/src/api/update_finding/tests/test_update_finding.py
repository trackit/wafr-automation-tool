from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from entities.finding import FindingDto
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import UpdateFindingInput

from ..app.tasks.update_finding import UpdateFinding


def test_update_finding():
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
    assessment_service.update_finding = MagicMock(return_value=True)
    finding_dto = FindingDto(hidden=True)

    task_input = UpdateFindingInput(
        assessment_id="AID",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BPI",
        finding_id="FID",
        finding_dto=finding_dto,
    )
    task = UpdateFinding(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assessment_service.update_finding.assert_called_once_with(assessment, "PI", "QI", "BPI", "FID", finding_dto)
    assert response.status_code == OK
    assert not response.body


def test_update_finding_not_found():
    assessment = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    finding_dto = FindingDto(hidden=True)

    task_input = UpdateFindingInput(
        assessment_id="AID",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BPI",
        finding_id="FID",
        finding_dto=finding_dto,
    )
    task = UpdateFinding(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assert response.status_code == NOT_FOUND
    assert not response.body
