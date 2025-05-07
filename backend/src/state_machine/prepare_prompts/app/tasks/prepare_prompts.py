import json
from collections import Counter
from typing import override

from common.config import (
    ASSESSMENT_PK,
    CHUNK_SIZE,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    S3_BUCKET,
    STORE_CHUNK_PATH,
    STORE_PROMPT_PATH,
)
from common.task import Task
from entities.ai import Chunk, PromptS3Uri, PromptVariables
from entities.assessment import AssessmentData, AssessmentID
from entities.database import UpdateAttrsInput
from entities.finding import FilteringRules, Finding, FindingExtra
from entities.scanning_tools import ScanningTool
from exceptions.scanning_tool import InvalidScanningToolError
from services.database import IDatabaseService
from services.scanning_tools import IScanningToolService
from services.scanning_tools.list import SCANNING_TOOL_SERVICES
from services.storage import IStorageService
from utils.files import get_filtering_rules
from utils.questions import QuestionSet
from utils.s3 import get_s3_uri

from state_machine.event import PreparePromptsInput


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        formatted_question_set: QuestionSet,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.formatted_question_set = formatted_question_set

    def populate_dynamodb(
        self, findings: list[FindingExtra], assessment_id: AssessmentID, scanning_tool: ScanningTool
    ) -> None:
        assessment_data = AssessmentData(
            regions=dict(
                Counter(
                    [
                        resource.region
                        for finding in findings
                        for resource in (finding.resources or [])
                        if resource.region is not None
                    ]
                )
            ),
            resource_types=dict(
                Counter(
                    [
                        resource.type
                        for finding in findings
                        for resource in (finding.resources or [])
                        if resource.type is not None
                    ]
                )
            ),
            severities=dict(Counter([finding.severity for finding in findings if finding.severity is not None])),
            findings=sum(len(finding.resources or []) for finding in findings),
        )
        self.database_service.update_attrs(
            table_name=DDB_TABLE,
            event=UpdateAttrsInput(
                key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
                attrs={
                    "findings": self.formatted_question_set.data,
                    "question_version": self.formatted_question_set.version,
                },
            ),
        )
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            UpdateExpression="SET raw_graph_datas.#scanning_tool = :data",
            ExpressionAttributeNames={
                "#scanning_tool": scanning_tool,
            },
            ExpressionAttributeValues={
                ":data": assessment_data,
            },
        )

    def store_chunk(
        self,
        scanning_tool_service: IScanningToolService,
        assessment_id: AssessmentID,
        chunk_index: int,
        chunk: list[FindingExtra],
    ) -> None:
        key = STORE_CHUNK_PATH.format(assessment_id, f"{scanning_tool_service.name}_{chunk_index}")
        self.storage_service.put(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps([finding.model_dump(exclude_none=True) for finding in chunk]),
        )

    def create_chunks(
        self,
        scanning_tool_service: IScanningToolService,
        assessment_id: AssessmentID,
        findings: list[FindingExtra],
    ) -> list[Chunk]:
        initial_chunks = [findings[i : i + CHUNK_SIZE] for i in range(0, len(findings), CHUNK_SIZE)]
        chunks: list[Chunk] = []
        for i, chunk in enumerate(initial_chunks):
            self.store_chunk(scanning_tool_service, assessment_id, i, chunk)
            chunks.append([Finding(**finding.model_dump(exclude_none=True)) for finding in chunk])
        return chunks

    def format_llm_questions(self) -> str:
        best_practices = []
        best_practice_id = 1
        for pillar_data in self.formatted_question_set.data.values():
            for question_data in pillar_data.get("questions").values():
                for best_practice_data in question_data.get("best_practices").values():
                    best_practices.append(
                        {
                            "id": best_practice_id,
                            "pillar": pillar_data.get("label"),
                            "question": question_data.get("label"),
                            "best_practice": {
                                "label": best_practice_data.get("label"),
                                "description": best_practice_data.get("description"),
                            },
                        }
                    )
                    best_practice_id += 1
        return json.dumps(best_practices, separators=(",", ":")).replace(":{}", "")

    def store_prompt_variables_list(
        self,
        scanning_tool_service: IScanningToolService,
        assessment_id: AssessmentID,
        prompt_variables_list: list[PromptVariables],
    ) -> list[PromptS3Uri]:
        prompt_variables_uris: list[PromptS3Uri] = []
        for i, prompt_variables in enumerate(prompt_variables_list):
            key = STORE_PROMPT_PATH.format(assessment_id, f"{scanning_tool_service.name}_{i}")
            prompt_variables_uris.append(get_s3_uri(S3_BUCKET, key))
            self.storage_service.put(
                Bucket=S3_BUCKET,
                Key=key,
                Body=json.dumps(prompt_variables.model_dump(), separators=(",", ":")),
            )
        return prompt_variables_uris

    def create_prompt_variables_list(
        self, scanning_tool_service: IScanningToolService, assessment_id: AssessmentID, chunks: list[Chunk]
    ) -> list[str]:
        prompt_variables_list: list[PromptVariables] = []
        questions = self.format_llm_questions()
        for chunk in chunks:
            prompt_variables = PromptVariables(
                scanning_tool_title=scanning_tool_service.title,
                question_set_data=questions,
                scanning_tool_data=chunk,
            )
            prompt_variables_list.append(prompt_variables)
        return self.store_prompt_variables_list(scanning_tool_service, assessment_id, prompt_variables_list)

    def manual_filtering(
        self, assessment_id: AssessmentID, scanning_tool: ScanningTool, findings: list[FindingExtra]
    ) -> list[FindingExtra]:
        filtering_rules = FilteringRules(**json.loads(get_filtering_rules()))
        for finding in findings:
            if not finding.metadata or not finding.metadata.event_code:
                continue
            finding_rule = filtering_rules.get(finding.metadata.event_code)
            if not finding_rule:
                continue
            pillar_data = next(
                (
                    pillar
                    for pillar in self.formatted_question_set.data.values()
                    if pillar.get("primary_id").lower() == finding_rule.get("pillar").lower()
                ),
                None,
            )
            if not pillar_data:
                continue
            question_data = next(
                (
                    question
                    for question in pillar_data.get("questions", {}).values()
                    if question.get("primary_id").lower() == finding_rule.get("question").lower()
                ),
                None,
            )
            if not question_data:
                continue
            best_practice_data = next(
                (
                    best_practice
                    for best_practice in question_data.get("best_practices", {}).values()
                    if best_practice.get("primary_id").lower() == finding_rule.get("best_practice").lower()
                ),
                None,
            )
            if not best_practice_data:
                continue
            formatted_finding_id = f"{scanning_tool}:{finding.id}"
            best_practice_data["results"].append(formatted_finding_id)
            self.database_service.put(
                table_name=DDB_TABLE,
                item={
                    **finding.model_dump(exclude={"id"}).copy(),
                    DDB_KEY: assessment_id,
                    DDB_SORT_KEY: formatted_finding_id,
                },
            )
            findings.remove(finding)
        return findings

    def create_prompts(self, scanning_tool_service: IScanningToolService, event: PreparePromptsInput) -> list[str]:
        findings = scanning_tool_service.retrieve_filtered_findings(event.assessment_id, event.regions, event.workflows)
        findings = self.manual_filtering(event.assessment_id, event.scanning_tool, findings)
        self.populate_dynamodb(findings, event.assessment_id, event.scanning_tool)
        chunks = self.create_chunks(scanning_tool_service, event.assessment_id, findings)
        return self.create_prompt_variables_list(scanning_tool_service, event.assessment_id, chunks)

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        scanning_tool_service_type = SCANNING_TOOL_SERVICES.get(event.scanning_tool)
        if scanning_tool_service_type is None:
            raise InvalidScanningToolError(event.scanning_tool)
        scanning_tool_service: IScanningToolService = scanning_tool_service_type(self.storage_service)
        return self.create_prompts(scanning_tool_service, event)
