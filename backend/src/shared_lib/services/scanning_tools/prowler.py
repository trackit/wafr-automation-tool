import json
from typing import override

from common.config import PROWLER_OCSF_PATH, S3_BUCKET
from common.entities import FindingExtra, ScanningTool
from entities.prowler.events.findings.detection_finding import DetectionFinding

from services.scanning_tools import IScanningToolService
from services.storage import IStorageService


class ProwlerService(IScanningToolService):
    def __init__(self, storage_service: IStorageService) -> None:
        super().__init__(storage_service=storage_service, name=ScanningTool.PROWLER, title="Prowler")

    @override
    def retrieve_findings(self, assessment_id: str) -> list[FindingExtra]:
        key = PROWLER_OCSF_PATH.format(assessment_id)
        content = self.storage_service.get(Bucket=S3_BUCKET, Key=key)
        loaded_content = json.loads(content)
        raw_findings = [DetectionFinding(**item) for item in loaded_content]
        failed_findings = [item.copy(update={"hidden": False}) for item in raw_findings if item.status_code == "FAIL"]
        return [FindingExtra(**item.dict(), id=str(i + 1)) for i, item in enumerate(failed_findings)]
