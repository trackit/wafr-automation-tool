import logging
import time
from http.client import INTERNAL_SERVER_ERROR, NOT_FOUND, OK
from typing import override

from common.task import Task
from entities.api import WorkloadId
from entities.assessment import Assessment
from entities.best_practice import BestPractice
from entities.question import Pillar, Question
from services.assessment import IAssessmentService
from types_boto3_wellarchitected import WellArchitectedClient
from types_boto3_wellarchitected.type_defs import (
    AnswerSummaryTypeDef,
    ChoiceTypeDef,
    PillarReviewSummaryTypeDef,
    WorkloadSummaryTypeDef,
)
from utils.api import APIResponse

from api.config import WAFRLens
from api.event import ExportWellArchitectedToolInput

logger = logging.getLogger("ExportWellArchitectedTool")
logger.setLevel(logging.ERROR)


class ExportWellArchitectedTool(Task[ExportWellArchitectedToolInput, APIResponse[None]]):
    def __init__(self, assessment_service: IAssessmentService, well_architect_client: WellArchitectedClient) -> None:
        super().__init__()
        self.assessment_service = assessment_service
        self.well_architect_client = well_architect_client

    def does_workload_exist(self, workload_name: str) -> WorkloadSummaryTypeDef | None:
        workloads = self.well_architect_client.list_workloads()["WorkloadSummaries"]
        return next((workload for workload in workloads if workload.get("WorkloadName") == workload_name), None)

    def create_workload(self, assessment: Assessment, event: ExportWellArchitectedToolInput) -> WorkloadId:
        workload_name = f"wafr-{assessment.name.lower().replace(' ', '-')}-{assessment.id.lower()}"
        workload = self.does_workload_exist(workload_name)
        if workload is not None:
            workload_id = workload.get("WorkloadId")
            if workload_id is not None:
                return workload_id
        workload = self.well_architect_client.create_workload(
            WorkloadName=workload_name,
            Description=f"WAFR for {assessment.name}",
            Environment="PRODUCTION",
            Lenses=[WAFRLens],
            AwsRegions=assessment.regions or ["us-west-2"],
            ClientRequestToken=workload_name + str(time.time()),
            ReviewOwner=event.owner or "WAFR Automation Tool",
            Tags={
                "Owner": event.owner or "WAFR Automation Tool",
                "Project": "WAFR Automation Tool",
                "Name": assessment.name,
            },
        )
        return workload.get("WorkloadId")

    def export_best_practices(
        self,
        formatted_best_practices: list[BestPractice],
        question_choices: list[ChoiceTypeDef],
    ) -> list[str]:
        best_practices_selected: list[str] = []
        for best_practice in question_choices:
            best_practice_id = best_practice.get("ChoiceId")
            best_practice_title = best_practice.get("Title")
            if not best_practice_title or not best_practice_id:
                logger.error("Missing fields for best practice %s", best_practice_title)
                continue
            best_practice_data = next(
                (
                    best_practice
                    for best_practice in formatted_best_practices
                    if best_practice.label.lower() == best_practice_title.lower()
                ),
                None,
            )
            if best_practice_data is None:
                logger.error("Best practice not found: %s", best_practice_title)
                continue
            if best_practice_data.status:
                best_practices_selected.append(best_practice_id)
        return best_practices_selected

    def export_questions(
        self,
        workload_id: WorkloadId,
        formatted_questions: list[Question],
        pillar_answers: list[AnswerSummaryTypeDef],
    ) -> None:
        for question in pillar_answers:
            question_id = question.get("QuestionId")
            question_title = question.get("QuestionTitle")
            question_choices = question.get("Choices")
            if not question_title or not question_id or not question_choices:
                logger.error("Missing fields for question %s", question_title)
                continue
            question_data = next(
                (question for question in formatted_questions if question.label.lower() == question_title.lower()),
                None,
            )
            if question_data is None:
                logger.error("Question not found: %s", question_title)
                continue
            formatted_best_practices = list(question_data.best_practices.values())
            if question_data.none:
                best_practices_selected = [
                    choice.get("ChoiceId", "")
                    for choice in question_choices
                    if "None of these" in choice.get("Title", "")
                ]
            else:
                best_practices_selected = self.export_best_practices(formatted_best_practices, question_choices)
            self.well_architect_client.update_answer(
                WorkloadId=workload_id,
                LensAlias=WAFRLens,
                QuestionId=question_id,
                SelectedChoices=best_practices_selected,
                IsApplicable=not question_data.disabled,
            )

    def export_pillars(
        self,
        workload_id: WorkloadId,
        formatted_pillars: list[Pillar],
        pillar_reviews: list[PillarReviewSummaryTypeDef],
    ) -> None:
        for pillar in pillar_reviews:
            pillar_id = pillar.get("PillarId")
            pillar_name = pillar.get("PillarName")
            if not pillar_name or not pillar_id:
                logger.error("Missing fields for pillar %s", pillar_name)
                continue
            pillar_data = next(
                (pillar for pillar in formatted_pillars if pillar.label.lower() == pillar_name.lower()),
                None,
            )
            if pillar_data is None:
                logger.error("Pillar not found: %s", pillar_name)
                continue
            if pillar_data.disabled:
                continue
            formatted_questions = list(pillar_data.questions.values())
            if not formatted_questions:
                logger.error("No questions for pillar %s", pillar_name)
                continue
            pillar_answers = self.well_architect_client.list_answers(
                WorkloadId=workload_id, LensAlias=WAFRLens, PillarId=pillar_id, MaxResults=50
            ).get("AnswerSummaries", [])
            self.export_questions(workload_id, formatted_questions, pillar_answers)

    def export_well_architected_tool(self, assessment: Assessment, event: ExportWellArchitectedToolInput) -> bool:
        if not assessment.findings:
            return False
        formatted_pillars = list(assessment.findings.root.values())
        workload_id = self.create_workload(assessment, event)
        lens_review = self.well_architect_client.get_lens_review(WorkloadId=workload_id, LensAlias=WAFRLens)[
            "LensReview"
        ]
        pillar_reviews = lens_review.get("PillarReviewSummaries", [])
        self.export_pillars(workload_id, formatted_pillars, pillar_reviews)
        return True

    @override
    def execute(self, event: ExportWellArchitectedToolInput) -> APIResponse[None]:
        assessment = self.assessment_service.retrieve(event.assessment_id, event.owner_id)
        if not assessment:
            return APIResponse(
                status_code=NOT_FOUND,
                body=None,
            )
        if not self.export_well_architected_tool(assessment, event):
            return APIResponse(
                status_code=INTERNAL_SERVER_ERROR,
                body=None,
            )
        return APIResponse(
            status_code=OK,
            body=None,
        )
