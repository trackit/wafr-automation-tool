from http.client import OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from entities.best_practice import BestPractice
from tests.__mocks__.fake_assessment_service import FakeAssessmentService
from utils.questions import QuestionSetData

from api.event import DeleteAssessmentInput

from ..app.tasks.delete_assessment import DeleteAssessment


def test_delete_assessment():
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        organization="test-organization",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="High",
                                    status=False,
                                    results=[],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve = MagicMock(return_value=assessment)
    assessment_service.delete = MagicMock(return_value=True)
    assessment_service.delete_findings = MagicMock(return_value=True)
    sfn_client = MagicMock()

    task_input = DeleteAssessmentInput(assessment_id=assessment.id, organization=assessment.organization)
    task = DeleteAssessment(assessment_service, sfn_client)
    response = task.execute(task_input)

    assessment_service.delete.assert_called_once_with(assessment.id, assessment.organization)
    assessment_service.delete_findings.assert_called_once_with(assessment)
    assert response.status_code == OK
    assert not response.body
