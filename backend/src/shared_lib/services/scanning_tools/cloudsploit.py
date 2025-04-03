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

    def convert_raw_finding(self, index: int, finding: CloudSploitFinding) -> FindingExtra:
        resources = []
        if finding.resource != "N/A":
            resources.append(FindingResource(uid=finding.resource, region=finding.region))

        return FindingExtra(
            id=str(index + 1),
            status_detail=finding.message,
            resources=resources,
            risk_details=finding.description,
            hidden=False,
        )

    @override
    def retrieve_findings(self, assessment_id: AssessmentID) -> list[FindingExtra]:
        key = CLOUDSPLOIT_OUTPUT_PATH.format(assessment_id)
        content = self.storage_service.get(Bucket=S3_BUCKET, Key=key)
        loaded_content = json.loads(content)
        raw_findings = [CloudSploitFinding(**item) for item in loaded_content]
        return [self.convert_raw_finding(i, raw_finding) for i, raw_finding in enumerate(raw_findings)]
