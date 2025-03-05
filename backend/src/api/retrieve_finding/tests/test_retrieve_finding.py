from unittest.mock import MagicMock

from common.entities import FindingExtra
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
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_finding = MagicMock(return_value=finding)

    task_input = RetrieveFindingInput(assessment_id="AID", finding_id="FID")
    task = RetrieveFinding(assessment_service)
    reponse = task.execute(task_input)

    assessment_service.retrieve_finding.assert_called_once()
    assert reponse.status_code == 200
    assert reponse.body == RetrieveFindingResponseBody(**finding.dict())
