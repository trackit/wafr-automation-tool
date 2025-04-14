from entities.api import APIAssessment
from entities.assessment import Assessment, Steps
from utils.assessment import convert_assessment_to_api_assessment


def test_convert_assessment_to_api_assessment():
    assessment = Assessment(
        id="test-assessment-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
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
    api_assessment = convert_assessment_to_api_assessment(assessment)

    assert api_assessment == APIAssessment(
        id="test-assessment-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=[
            {
                "id": "pillar-1",
                "label": "Pillar 1",
                "disabled": False,
                "questions": [
                    {
                        "id": "question-1",
                        "label": "Question 1",
                        "none": False,
                        "disabled": False,
                        "best_practices": [
                            {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
                                "hidden_results": [],
                            }
                        ],
                    }
                ],
            }
        ],
    )


def test_convert_assessment_to_api_assessment_no_findings():
    assessment = Assessment(
        id="test-assessment-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={},
    )
    api_assessment = convert_assessment_to_api_assessment(assessment)

    assert api_assessment == APIAssessment(
        id="test-assessment-id",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=[],
    )
