from typing import override

from common.entities import Assessment, AssessmentDto, BestPracticeExtra, FindingExtra
from services.assessment import IAssessmentService


class FakeAssessmentService(IAssessmentService):
    @override
    def retrieve(self, assessment_id: str) -> Assessment | None:
        raise NotImplementedError

    @override
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        pillar_id: str,
        question_id: str,
        best_practice_id: str,
    ) -> BestPracticeExtra | None:
        raise NotImplementedError

    @override
    def retrieve_finding(
        self,
        assessment_id: str,
        finding_id: str,
    ) -> FindingExtra | None:
        raise NotImplementedError

    @override
    def update(self, assessment_id: str, assessment_dto: AssessmentDto) -> None:
        raise NotImplementedError

    @override
    def delete_findings(self, assessment: Assessment) -> None:
        raise NotImplementedError

    @override
    def delete(self, assessment_id: str) -> None:
        raise NotImplementedError
