from entities.api import APIAssessment, APIFormattedPillar, APIFormattedQuestion
from entities.assessment import Assessment, Steps
from entities.best_practice import BestPractice
from utils.assessment import convert_assessment_to_api_assessment
from utils.questions import QuestionSetData


def test_convert_assessment_to_api_assessment():
    assessment = Assessment(
        id="test-assessment-id",
        owner_id="test-owner-id",
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
                                "best-practice-1": {
                                    "id": "best-practice-1",
                                    "primary_id": "best-practice-1",
                                    "label": "Best Practice 1",
                                    "description": "Best Practice 1 Description",
                                    "risk": "High",
                                    "status": False,
                                    "results": ["1", "2", "3"],
                                    "hidden_results": [],
                                }
                            },
                        }
                    },
                }
            }
        ),
    )
    api_assessment = convert_assessment_to_api_assessment(assessment)

    assert api_assessment == APIAssessment(
        id="test-assessment-id",
        owner_id="test-owner-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=[
            APIFormattedPillar(
                id="pillar-1",
                label="Pillar 1",
                disabled=False,
                questions=[
                    APIFormattedQuestion(
                        id="question-1",
                        label="Question 1",
                        none=False,
                        disabled=False,
                        best_practices=[
                            BestPractice(
                                id="best-practice-1",
                                primary_id="best-practice-1",
                                label="Best Practice 1",
                                description="Best Practice 1 Description",
                                risk="High",
                                status=False,
                                results=["1", "2", "3"],
                                hidden_results=[],
                            )
                        ],
                    )
                ],
            )
        ],
    )


def test_convert_assessment_to_api_assessment_no_findings():
    assessment = Assessment(
        id="test-assessment-id",
        owner_id="test-owner-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData({}),
    )
    api_assessment = convert_assessment_to_api_assessment(assessment)

    assert api_assessment == APIAssessment(
        id="test-assessment-id",
        owner_id="test-owner-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=[],
    )
