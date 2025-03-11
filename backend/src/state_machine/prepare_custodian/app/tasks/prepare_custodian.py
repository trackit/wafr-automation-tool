from pathlib import Path
from typing import override

from common.config import S3_BUCKET
from common.task import Task
from services.storage import IStorageService
from utils.s3 import get_s3_uri


class PrepareCustodian(Task[None, str]):
    def __init__(self, storage_service: IStorageService) -> None:
        self.storage_service = storage_service
        super().__init__()

    def prepare_custodian(self) -> str:
        with Path("./policies/policies.yml").open() as f:
            policies = f.read()
        self.storage_service.put(Bucket=S3_BUCKET, Key="custodian.yml", Body=policies)
        return get_s3_uri(S3_BUCKET, "custodian.yml")

    @override
    def execute(self, event: None) -> str:
        return self.prepare_custodian()
