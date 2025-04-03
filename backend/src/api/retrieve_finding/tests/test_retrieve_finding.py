from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from entities.finding import FindingExtra
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RetrieveFindingInput, RetrieveFindingResponseBody

from ..app.tasks.retrieve_finding import RetrieveFinding


def test_retrieve_finding():
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
    assessment_service.retrieve_finding = MagicMock(return_value=finding)

    task_input = RetrieveFindingInput(assessment_id="AID", finding_id="FID")
    task = RetrieveFinding(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve_finding.assert_called_once()
    assert response.status_code == OK
    assert response.body is not None
    assert response.body == RetrieveFindingResponseBody(**finding.model_dump())


def test_retrieve_finding_not_found():
    finding = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_finding = MagicMock(return_value=finding)

    task_input = RetrieveFindingInput(assessment_id="AID", finding_id="FID")
    task = RetrieveFinding(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve_finding.assert_called_once()
    assert response.status_code == NOT_FOUND
    assert not response.body
