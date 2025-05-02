from http.client import NOT_FOUND, OK
from typing import override

from common.task import Task
from entities.assessment import Assessment
from services.assessment import IAssessmentService
from utils.api import APIResponse
from utils.assessment import convert_assessment_to_api_assessment

from api.event import RetrieveAssessmentInput, RetrieveAssessmentResponseBody


class RetrieveAssessment(
    Task[RetrieveAssessmentInput, APIResponse[RetrieveAssessmentResponseBody]],
):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        super().__init__()
        self.assessment_service = assessment_service

    def remove_hidden_findings(self, assessment: Assessment) -> Assessment:
        if not assessment.findings:
            return assessment
        for pillar in assessment.findings.values():
            for question in pillar.get("questions", {}).values():
                for best_practice in question.get("best_practices", {}).values():
                    hidden_results: list[str] = best_practice.get("hidden_results", [])
                    best_practice["results"] = [
                        result for result in best_practice.get("results", []) if result not in hidden_results
                    ]
        return assessment

    @override
    def execute(
        self,
        event: RetrieveAssessmentInput,
    ) -> APIResponse[RetrieveAssessmentResponseBody]:
        assessment = self.assessment_service.retrieve(event.assessment_id)
        if not assessment:
            return APIResponse(status_code=NOT_FOUND, body=None)
        assessment = self.remove_hidden_findings(assessment)
        api_assessment = convert_assessment_to_api_assessment(assessment)
        return APIResponse(
            status_code=OK,
            body=RetrieveAssessmentResponseBody(
                **api_assessment.model_dump(),
            ),
        )
