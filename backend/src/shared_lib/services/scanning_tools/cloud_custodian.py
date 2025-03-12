from typing import override

from common.entities import FindingExtra

from services.scanning_tools import IScanningToolService
from services.storage import IStorageService


class CloudCustodianService(IScanningToolService):
    def __init__(self, storage_service: IStorageService) -> None:
        super().__init__(storage_service=storage_service, name="cloudcustodian", title="Cloud Custodian")

    @override
    def retrieve_findings(self, assessment_id: str) -> list[FindingExtra]:
        return []
