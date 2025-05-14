from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.api import APIBestPracticeExtra
from entities.assessment import Assessment, Steps
from entities.finding import FindingExtra
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RetrieveBestPracticeFindingsInput

from ..app.tasks.retrieve_best_practice_findings import (
    RetrieveBestPracticeFindings,
)


def test_retrieve_best_practice_findings():
    assessment = Assessment(
        id="AID",
        created_by="test-created-by",
        name="AN",
        regions=["test-region"],
        role_arn="AR",
        workflows=["test-workflow"],
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
    )
    finding: FindingExtra = FindingExtra(
        id="FID",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
        hidden=False,
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.retrieve_api_best_practice = MagicMock(
        return_value=APIBestPracticeExtra(
            id="BP",
            description="Best Practice 1 Description",
            risk="High",
            status=False,
            label="Best Practice 1",
            results=[finding],
            hidden_results=[],
        )
    )

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        created_by="test-created-by",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-created-by")
    assessment_service.retrieve_api_best_practice.assert_called_once_with(assessment, "PI", "QI", "BP")
    assert response.status_code == OK
    assert response.body is not None
    assert response.body.model_dump(
        exclude_none=True
    ) == assessment_service.retrieve_api_best_practice.return_value.model_dump(exclude_none=True)


def test_retrieve_best_practice_findings_not_found_assessment():
    assessment = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        created_by="test-created-by",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-created-by")
    assert response.status_code == NOT_FOUND
    assert not response.body


def test_retrieve_best_practice_findings_not_found_findings():
    assessment = Assessment(
        id="AID",
        created_by="test-created-by",
        name="AN",
        regions=["test-region"],
        role_arn="AR",
        workflows=["test-workflow"],
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings=None,
    )
    finding = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.retrieve_api_best_practice = MagicMock(return_value=finding)

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        created_by="test-created-by",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-created-by")
    assessment_service.retrieve_api_best_practice.assert_called_once_with(assessment, "PI", "QI", "BP")
    assert response.status_code == NOT_FOUND
    assert not response.body
