from unittest.mock import MagicMock

from common.entities import Assessment, FindingExtra
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RetrieveBestPracticeFindingsInput

from ..app.tasks.retrieve_best_practice_findings import (
    RetrieveBestPracticeFindings,
)


def test_retrieve_best_practice_findings():
    assessment = Assessment(id="AID", name="AN", role="AR", step=0, question_version="QV", findings=None)
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
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.retrieve_best_practice = MagicMock(return_value=[finding])

    task_input = RetrieveBestPracticeFindingsInput(
        assessment_id="AID",
        best_practice="BP",
    )
    task = RetrieveBestPracticeFindings(assessment_service)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    assessment_service.retrieve_best_practice.assert_called_once_with(assessment, "BP")
    assert response.status_code == 200
    assert response.body == assessment_service.retrieve_best_practice.return_value
