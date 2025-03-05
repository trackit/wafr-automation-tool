from typing import Unpack, override

from services.storage import IStorageService
from types_boto3_s3.service_resource import ObjectSummary
from types_boto3_s3.type_defs import (
    DeleteObjectRequestTypeDef,
    DeleteObjectsOutputTypeDef,
    GetObjectRequestTypeDef,
    PutObjectRequestTypeDef,
)


class FakeStorageService(IStorageService):
    @override
    def get(self, **kwargs: Unpack[GetObjectRequestTypeDef]) -> str:
        raise NotImplementedError

    @override
    def put(self, **kwargs: Unpack[PutObjectRequestTypeDef]) -> None:
        raise NotImplementedError

    @override
    def delete(self, **kwargs: Unpack[DeleteObjectRequestTypeDef]) -> None:
        raise NotImplementedError

    @override
    def filter(self, bucket_name: str, prefix: str) -> list[ObjectSummary]:
        raise NotImplementedError

    @override
    def bulk_delete(
        self,
        bucket_name: str,
        keys: list[str],
    ) -> DeleteObjectsOutputTypeDef | None:
        raise NotImplementedError
