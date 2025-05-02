from http.client import OK
from unittest.mock import MagicMock

from entities.assessment import Assessment, Steps
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import ExportWellArchitectedToolInput

from ..app.tasks.export_well_architected_tool import ExportWellArchitectedTool


def test_export_well_architected_tool():
    assessment = Assessment(
        id="AID",
        name="AN",
        regions=["test-region"],
        role_arn="AR",
        workflows=["test-workflow"],
        step=Steps.SCANNING_STARTED,
        created_at="",
        question_version="QV",
        findings={
            "pillar-1": {
                "id": "pillar-1",
                "label": "Pillar 1",
                "disabled": False,
                "questions": {
                    "question-1": {
                        "id": "question-1",
                        "label": "Question 1",
                        "none": False,
                        "disabled": False,
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
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
    well_architect_client = MagicMock()
    well_architect_client.get_lens_review = MagicMock(
        return_value={
            "LensReview": {
                "PillarReviewSummaries": [
                    {
                        "PillarId": "pillar-1",
                        "PillarName": "Pillar 1",
                    }
                ]
            }
        }
    )
    well_architect_client.list_answers = MagicMock(
        return_value={
            "AnswerSummaries": [
                {
                    "QuestionId": "question-1",
                    "QuestionTitle": "Question 1",
                    "Choices": [
                        {
                            "Title": "Best Practice 1",
                            "ChoiceId": "best-practice-1",
                        }
                    ],
                }
            ]
        }
    )
    well_architect_client.update_answer = MagicMock()
    task_input = ExportWellArchitectedToolInput(assessment_id="AID")
    task = ExportWellArchitectedTool(assessment_service, well_architect_client)
    response = task.execute(task_input)

    assessment_service.retrieve.assert_called_once_with("AID")
    well_architect_client.get_lens_review.assert_called_once()
    well_architect_client.list_answers.assert_called_once()
    well_architect_client.update_answer.assert_called_once()
    assert response.status_code == OK
    assert not response.body
