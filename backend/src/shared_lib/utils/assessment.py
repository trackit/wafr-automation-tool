from typing import TYPE_CHECKING

from entities.api import APIAssessment, APIFormattedPillar, APIFormattedQuestion
from entities.assessment import Assessment

if TYPE_CHECKING:
    from entities.best_practice import BestPractice


def convert_all_assessments_to_api_assessments(assessments: list[Assessment]) -> list[APIAssessment]:
    return [convert_assessment_to_api_assessment(assessment) for assessment in assessments]


def convert_assessment_to_api_assessment(assessment: Assessment) -> APIAssessment:
    findings: list[APIFormattedPillar] = []
    if assessment.findings:
        for pillar in assessment.findings.root.values():
            questions: list[APIFormattedQuestion] = []
            for question in pillar.questions.values():
                best_practices: list[BestPractice] = list(question.best_practices.values())
                questions.append(
                    APIFormattedQuestion(
                        **question.model_dump(exclude={"best_practices"}), best_practices=best_practices
                    )
                )
            findings.append(APIFormattedPillar(**pillar.model_dump(exclude={"questions"}), questions=questions))
    return APIAssessment(**assessment.model_dump(exclude={"findings", "raw_graph_datas"}), findings=findings)
