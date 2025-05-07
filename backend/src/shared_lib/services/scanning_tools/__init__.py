from abc import ABC, abstractmethod

from entities.assessment import AssessmentID
from entities.finding import FindingExtra

from services.storage import IStorageService


class IScanningToolService(ABC):
    def __init__(self, storage_service: IStorageService, name: str, title: str) -> None:
        super().__init__()
        self.name = name
        self.title = title
        self.storage_service = storage_service

    @abstractmethod
    def retrieve_findings(self, assessment_id: AssessmentID, regions: list[str]) -> list[FindingExtra]:
        raise NotImplementedError


class BaseScanningToolService(IScanningToolService):
    def __init__(self, storage_service: IStorageService, name: str, title: str) -> None:
        super().__init__(storage_service=storage_service, name=name, title=title)

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

    def retrieve_filtered_findings(
        self, assessment_id: AssessmentID, regions: list[str], workflows: list[str]
    ) -> list[FindingExtra]:
        findings = self.retrieve_findings(assessment_id, regions)
        return self.filter_findings(findings, workflows)
