from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.api import APIAssessment
from entities.assessment import Steps
from freezegun import freeze_time
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RescanAssessmentInput

from ..app.tasks.rescan_assessment import RescanAssessment


@freeze_time("2000-01-01T00:00:00.000000+00:00")
def test_rescan_assessment():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": OK}})
    assessment = APIAssessment(
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
        findings=[],
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.delete_findings = MagicMock()
    assessment_service.delete = MagicMock()

    task_input = RescanAssessmentInput(
        assessment_id="AID",
        organization="test-organization",
    )
    task = RescanAssessment(assessment_service, sfn_client)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-organization")
    assessment_service.delete_findings.assert_called_once_with(assessment)
    assessment_service.delete.assert_called_once_with("AID", "test-organization")
    assert response.status_code == OK
    assert response.body is None


@freeze_time("2000-01-01T00:00:00.000000+00:00")
def test_rescan_assessment_not_found():
    sfn_client = MagicMock()
    sfn_client.start_execution = MagicMock(return_value={"ResponseMetadata": {"HTTPStatusCode": OK}})
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=None)

    task_input = RescanAssessmentInput(
        assessment_id="AID",
        organization="test-organization",
    )
    task = RescanAssessment(assessment_service, sfn_client)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID", "test-organization")
    assert response.status_code == NOT_FOUND
    assert not response.body
