from typing import TYPE_CHECKING, Any

from entities.api import APIAssessment, APIFormattedPillar, APIFormattedQuestion
from entities.assessment import Assessment

if TYPE_CHECKING:
    from entities.best_practice import BestPractice


def convert_all_assessments_to_api_assessments(assessments: list[Assessment]) -> list[APIAssessment]:
    return [convert_assessment_to_api_assessment(assessment) for assessment in assessments]


def convert_assessment_to_api_assessment(assessment: Assessment) -> APIAssessment:
    assessment_dict = assessment.model_dump(exclude={"findings", "raw_graph_datas"})
    findings: list[APIFormattedPillar] = []

    if assessment.findings:
        for pillar in assessment.findings.values():
            questions: list[APIFormattedQuestion] = []
            for question in pillar.get("questions").values():
                question_copy: Any = question.copy()
                best_practices: list[BestPractice] = list(question.get("best_practices").values())
                question_copy["best_practices"] = best_practices
                questions.append(question_copy)
            pillar_copy: Any = pillar.copy()
            pillar_copy["questions"] = questions
            findings.append(pillar_copy)
    return APIAssessment(**assessment_dict, findings=findings)
