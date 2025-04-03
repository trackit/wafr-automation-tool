from http.client import OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import DeleteAssessmentInput

from ..app.tasks.delete_assessment import DeleteAssessment


def test_delete_assessment():
    assessment = Assessment(
        id="test-assessment-id",
        name="test-assessment-name",
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={
            "pillar-1": {
                "id": "pillar-1",
                "label": "Pillar 1",
                "questions": {
                    "question-1": {
                        "id": "question-1",
                        "label": "Question 1",
                        "resolve": False,
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["prowler:1"],
                                "hidden_results": [],
                            }
                        },
                    }
                },
            }
        },
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.delete = MagicMock(return_value=True)
    assessment_service.delete_findings = MagicMock(return_value=True)

    task_input = DeleteAssessmentInput(assessment_id="AID")
    task = DeleteAssessment(assessment_service)
    response = task.execute(task_input)

    assessment_service.delete.assert_called_once_with("AID")
    assessment_service.delete_findings.assert_called_once_with(assessment)
    assert response.status_code == OK
    assert not response.body
