import json
from typing import override

from common.config import PROWLER_OCSF_PATH, S3_BUCKET
from common.entities import FindingExtra

from services.scanning_tools import IScanningToolService
from services.storage import IStorageService


class ProwlerService(IScanningToolService):
    def __init__(self, storage_service: IStorageService) -> None:
        super().__init__(storage_service=storage_service, name="prowler", title="Prowler")

    @override
    def retrieve_findings(self, assessment_id: str) -> list[FindingExtra]:
        key = PROWLER_OCSF_PATH.format(assessment_id)
        content = self.storage_service.get(Bucket=S3_BUCKET, Key=key)
        loaded_content = json.loads(content)
        return [FindingExtra(**item, id=str(i + 1)) for i, item in enumerate(loaded_content)]
