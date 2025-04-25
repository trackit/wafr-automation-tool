import json
from typing import Any, override

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
from entities.assessment import AssessmentID
from entities.database import UpdateAttrsInput
from entities.finding import Finding, FindingExtra
from exceptions.scanning_tool import InvalidScanningToolError
from services.database import IDatabaseService
from services.scanning_tools import IScanningToolService
from services.scanning_tools.list import SCANNING_TOOL_SERVICES
from services.storage import IStorageService
from utils.questions import FormattedQuestionSet
from utils.s3 import get_s3_uri

from state_machine.event import PreparePromptsInput


class PreparePrompts(Task[PreparePromptsInput, list[str]]):
    def __init__(
        self,
        database_service: IDatabaseService,
        storage_service: IStorageService,
        formatted_question_set: FormattedQuestionSet,
    ) -> None:
        super().__init__()
        self.database_service = database_service
        self.storage_service = storage_service
        self.formatted_question_set = formatted_question_set

    def populate_dynamodb(self, assessment_id: AssessmentID) -> None:
        attrs: dict[str, Any] = {
            "findings": self.formatted_question_set.data,
            "question_version": self.formatted_question_set.version,
        }
        event = UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            attrs=attrs,
        )
        self.database_service.update_attrs(table_name=DDB_TABLE, event=event)

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

    def retrieve_questions(self) -> str:
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
                                "label": best_practice_data.label,
                                "description": best_practice_data.description,
                            },
                        }
                    )
                    best_practice_id += 1
        return json.dumps(best_practices, separators=(",", ":")).replace(":{}", "")

    def merge_findings(self, findings: list[FindingExtra]) -> list[FindingExtra]:
        grouped_findings = {}
        index = 1
        for finding in findings:
            key = (finding.status_detail, finding.risk_details)
            if key not in grouped_findings:
                finding.id = str(index)
                index += 1
                grouped_findings[key] = finding
            else:
                existing = grouped_findings[key]
                if existing.resources is None:
                    existing.resources = finding.resources
                elif finding.resources and finding.resources not in existing.resources:
                    existing.resources.extend(finding.resources)
        return list(grouped_findings.values())

    def is_finding_in_workflow(self, finding: FindingExtra, workflows: list[str]) -> bool:
        if not workflows:
            return True
        filtered_resources = [
            resource
            for resource in finding.resources or []
            if (resource.name and any(w in resource.name.lower() for w in workflows))
            or (resource.uid and any(w in resource.uid.lower() for w in workflows))
        ]
        if filtered_resources:
            finding.resources = filtered_resources
            return True
        if finding.risk_details and any(w in finding.risk_details.lower() for w in workflows):
            return True
        return bool(finding.status_detail and any(w in finding.status_detail.lower() for w in workflows))

    def is_self_made_finding(self, finding: FindingExtra) -> bool:
        return bool(
            finding.resources and finding.resources[0].uid and "wafr-automation-tool" in finding.resources[0].uid
        )

    def filter_findings(self, findings: list[FindingExtra], workflows: list[str]) -> list[FindingExtra]:
        return [
            finding
            for finding in findings
            if self.is_finding_in_workflow(finding, workflows) and not self.is_self_made_finding(finding)
        ]

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
        questions = self.retrieve_questions()
        for chunk in chunks:
            prompt_variables = PromptVariables(
                scanning_tool_title=scanning_tool_service.title,
                question_set_data=questions,
                scanning_tool_data=chunk,
            )
            prompt_variables_list.append(prompt_variables)
        return self.store_prompt_variables_list(scanning_tool_service, assessment_id, prompt_variables_list)

    @override
    def execute(self, event: PreparePromptsInput) -> list[str]:
        scanning_tool_service_type = SCANNING_TOOL_SERVICES.get(event.scanning_tool)
        if scanning_tool_service_type is None:
            raise InvalidScanningToolError(event.scanning_tool)
        self.populate_dynamodb(event.assessment_id)
        scanning_tool_service: IScanningToolService = scanning_tool_service_type(self.storage_service)
        findings = scanning_tool_service.retrieve_findings(event.assessment_id, event.regions)
        findings = self.filter_findings(findings, event.workflows)
        findings = self.merge_findings(findings)
        chunks = self.create_chunks(scanning_tool_service, event.assessment_id, findings)
        return self.create_prompt_variables_list(scanning_tool_service, event.assessment_id, chunks)
