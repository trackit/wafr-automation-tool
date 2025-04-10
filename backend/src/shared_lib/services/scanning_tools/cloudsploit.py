import json
from typing import override

from common.config import CLOUDSPLOIT_OUTPUT_PATH, S3_BUCKET
from entities.assessment import AssessmentID
from entities.finding import FindingExtra, FindingResource
from entities.scanning_tools import CloudSploitFinding, ScanningTool

from services.scanning_tools import IScanningToolService
from services.storage import IStorageService


class CloudSploitService(IScanningToolService):
    def __init__(self, storage_service: IStorageService) -> None:
        super().__init__(storage_service=storage_service, name=ScanningTool.CLOUDSPLOIT, title="CloudSploit")

    def convert_raw_findings(self, raw_findings: list[CloudSploitFinding], regions: list[str]) -> list[FindingExtra]:
        findings: list[FindingExtra] = []
        for index, raw_finding in enumerate(raw_findings):
            if regions and raw_finding.region not in regions:
                continue
            resources = [
                FindingResource(
                    uid=raw_finding.resource if raw_finding.resource != "N/A" else None, region=raw_finding.region
                )
            ]
            findings.append(
                FindingExtra(
                    id=str(index + 1),
                    status_detail=raw_finding.message,
                    resources=resources,
                    risk_details=raw_finding.description,
                    hidden=False,
                )
            )
        return findings

    @override
    def retrieve_findings(self, assessment_id: AssessmentID, regions: list[str]) -> list[FindingExtra]:
        key = CLOUDSPLOIT_OUTPUT_PATH.format(assessment_id)
        content = self.storage_service.get(Bucket=S3_BUCKET, Key=key)
        loaded_content = json.loads(content)
        raw_findings = [CloudSploitFinding(**item) for item in loaded_content]
        return self.convert_raw_findings(raw_findings, regions)
