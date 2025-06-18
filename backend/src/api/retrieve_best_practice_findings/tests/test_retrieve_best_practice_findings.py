from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.api import APIPagination, APIPaginationOutput
from entities.assessment import Assessment, Steps
from entities.best_practice import BestPractice
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
        organization="test-organization",
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
    assessment_service.retrieve_best_practice = MagicMock(
        return_value=BestPractice(
            id="BP",
            description="Best Practice 1 Description",
            risk="High",
            status=False,
            label="Best Practice 1",
            results=[],
            hidden_results=[],
        )
    )
    assessment_service.retrieve_best_practice_findings = MagicMock(
        return_value=APIPaginationOutput[FindingExtra](items=[], next_token=None)
    )

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        organization="test-organization",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
        limit=10,
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-organization")
    assessment_service.retrieve_best_practice.assert_called_once_with(assessment, "PI", "QI", "BP")
    assessment_service.retrieve_best_practice_findings.assert_called_once_with(
        APIPagination(
            limit=10,
            next_token=None,
            filter_expression="(#hidden = :hidden)",
            attribute_name={"#hidden": "hidden"},
            attribute_value={":hidden": False},
        ),
        "AID",
        "test-organization",
        "PI",
        "QI",
        "BP",
    )
    assert response.status_code == OK
    assert response.body is not None
    assert response.body.model_dump(
        exclude_none=True
    ) == assessment_service.retrieve_best_practice_findings.return_value.model_dump(exclude_none=True)


def test_retrieve_best_practice_findings_not_found_assessment():
    assessment = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        organization="test-organization",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
        limit=10,
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-organization")
    assert response.status_code == NOT_FOUND
    assert not response.body


def test_retrieve_best_practice_findings_not_found_findings():
    assessment = Assessment(
        id="AID",
        created_by="test-created-by",
        organization="test-organization",
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
    assessment_service.retrieve_best_practice = MagicMock(return_value=finding)

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        organization="test-organization",
        pillar_id="PI",
        question_id="QI",
        best_practice_id="BP",
        limit=10,
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-organization")
    assessment_service.retrieve_best_practice.assert_called_once_with(assessment, "PI", "QI", "BP")
    assert response.status_code == NOT_FOUND
    assert not response.body
