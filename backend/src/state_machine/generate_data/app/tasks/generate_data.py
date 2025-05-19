from collections import Counter
from typing import override

from common.task import Task
from entities.assessment import AssessmentData, AssessmentDto
from entities.scanning_tools import ScanningTool
from services.assessment import IAssessmentService

from state_machine.event import GenerateDataInput


class GenerateData(Task[GenerateDataInput, None]):
    def __init__(self, assessment_service: IAssessmentService) -> None:
        self.assessment_service = assessment_service
        super().__init__()

    def generate_data(self, event: GenerateDataInput) -> None:
        assessment = self.assessment_service.retrieve(event.assessment_id, event.organization)
        if not assessment or not assessment.raw_graph_datas:
            return
        data: AssessmentData = AssessmentData(
            regions={},
            resource_types={},
            severities={},
            findings=0,
        )
        for scanning_tool in ScanningTool:
            scanning_tool_data = assessment.raw_graph_datas.get(scanning_tool.value, None)
            if not scanning_tool_data:
                continue
            data["regions"] = dict(Counter(data["regions"]) + Counter(scanning_tool_data["regions"]))
            data["resource_types"] = dict(
                Counter(data["resource_types"]) + Counter(scanning_tool_data["resource_types"])
            )
            data["severities"] = dict(Counter(data["severities"]) + Counter(scanning_tool_data["severities"]))
            data["findings"] += scanning_tool_data["findings"]
        self.assessment_service.update_assessment(
            event.assessment_id, AssessmentDto(graph_datas=data, raw_graph_datas={}), event.organization
        )

    @override
    def execute(self, event: GenerateDataInput) -> None:
        self.generate_data(event)
