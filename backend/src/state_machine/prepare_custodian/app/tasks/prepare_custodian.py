from typing import override

from common.config import CUSTODIAN_FILE_NAME, S3_BUCKET
from common.task import Task
from services.storage import IStorageService
from utils.files import get_custodian_policies
from utils.s3 import get_s3_uri


class PrepareCustodian(Task[None, str]):
    def __init__(self, storage_service: IStorageService) -> None:
        self.storage_service = storage_service
        super().__init__()

    def prepare_custodian(self) -> str:
        policies = get_custodian_policies()
        self.storage_service.put(Bucket=S3_BUCKET, Key=CUSTODIAN_FILE_NAME, Body=policies)
        return get_s3_uri(S3_BUCKET, CUSTODIAN_FILE_NAME)

    @override
    def execute(self, event: None) -> str:
        return self.prepare_custodian()
