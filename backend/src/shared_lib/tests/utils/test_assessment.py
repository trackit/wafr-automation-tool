from common.entities import APIAssessment, Assessment
from common.enums import Steps
from utils.assessment import convert_assessment_to_api_assessment


def test_convert_assessment_to_api_assessment():
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
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
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
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=[
            {
                "id": "pillar-1",
                "label": "Pillar 1",
                "questions": [
                    {
                        "id": "question-1",
                        "label": "Question 1",
                        "best_practices": [
                            {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
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
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={},
    )
    api_assessment = convert_assessment_to_api_assessment(assessment)

    assert api_assessment == APIAssessment(
        id="test-assessment-id",
        name="test-assessment-name",
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=[],
    )
