from abc import ABC, abstractmethod
from typing import Unpack, override

from types_boto3_s3 import S3Client, S3ServiceResource
from types_boto3_s3.service_resource import ObjectSummary
from types_boto3_s3.type_defs import (
    DeleteObjectRequestTypeDef,
    DeleteObjectsOutputTypeDef,
    DeleteTypeDef,
    GetObjectRequestTypeDef,
    PutObjectRequestTypeDef,
)


class IStorageService(ABC):
    @abstractmethod
    def get(self, **kwargs: Unpack[GetObjectRequestTypeDef]) -> str:
        raise NotImplementedError

    @abstractmethod
    def put(self, **kwargs: Unpack[PutObjectRequestTypeDef]) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete(self, **kwargs: Unpack[DeleteObjectRequestTypeDef]) -> None:
        raise NotImplementedError

    @abstractmethod
    def filter(self, bucket_name: str, prefix: str) -> list[ObjectSummary]:
        raise NotImplementedError

    @abstractmethod
    def bulk_delete(
        self,
        bucket_name: str,
        keys: list[str],
    ) -> DeleteObjectsOutputTypeDef | None:
        raise NotImplementedError


class S3Service(IStorageService):
    def __init__(self, client: S3Client, resource: S3ServiceResource) -> None:
        super().__init__()
        self.s3_client = client
        self.resource = resource

    @override
    def get(self, **kwargs: Unpack[GetObjectRequestTypeDef]) -> str:
        reponse = self.s3_client.get_object(**kwargs)
        return reponse["Body"].read().decode("utf-8")

    @override
    def put(self, **kwargs: Unpack[PutObjectRequestTypeDef]) -> None:
        self.s3_client.put_object(**kwargs)

    @override
    def delete(self, **kwargs: Unpack[DeleteObjectRequestTypeDef]) -> None:
        self.s3_client.delete_object(**kwargs)

    @override
    def filter(self, bucket_name: str, prefix: str) -> list[ObjectSummary]:
        bucket = self.resource.Bucket(bucket_name)
        return list(bucket.objects.filter(Prefix=prefix))

    @override
    def bulk_delete(
        self,
        bucket_name: str,
        keys: list[str],
    ) -> DeleteObjectsOutputTypeDef | None:
        if not keys:
            return None
        delete_keys: DeleteTypeDef = {
            "Objects": [{"Key": key} for key in keys],
            "Quiet": True,
        }
        return self.s3_client.delete_objects(
            Bucket=bucket_name,
            Delete=delete_keys,
        )
