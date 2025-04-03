from typing import override

from entities.assessment import Assessment, AssessmentDto, AssessmentID
from entities.best_practice import BestPracticeExtra, BestPracticeID
from entities.finding import FindingExtra, FindingID
from entities.question import PillarID, QuestionID
from services.assessment import IAssessmentService


class FakeAssessmentService(IAssessmentService):
    @override
    def retrieve(self, assessment_id: AssessmentID) -> Assessment | None:
        raise NotImplementedError

    @override
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
    ) -> BestPracticeExtra | None:
        raise NotImplementedError

    @override
    def retrieve_finding(
        self,
        assessment_id: AssessmentID,
        finding_id: FindingID,
    ) -> FindingExtra | None:
        raise NotImplementedError

    @override
    def update(self, assessment_id: AssessmentID, assessment_dto: AssessmentDto) -> None:
        raise NotImplementedError

    @override
    def delete_findings(self, assessment: Assessment) -> None:
        raise NotImplementedError

    @override
    def delete(self, assessment_id: AssessmentID) -> None:
        raise NotImplementedError
