from abc import ABC, abstractmethod
from typing import Any, Optional, Unpack, override

from types_boto3_s3 import S3Client, S3ServiceResource
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
    def filter(self, bucket_name: str, prefix: str) -> list[Any]:
        raise NotImplementedError

    @abstractmethod
    def bulk_delete(
        self, bucket_name: str, objects: list[Any], quiet: bool = True
    ) -> Optional[DeleteObjectsOutputTypeDef]:
        raise NotImplementedError


class S3Service(IStorageService):
    def __init__(self, client: S3Client, resource: S3ServiceResource):
        super().__init__()
        self.client = client
        self.resource = resource

    @override
    def get(self, **kwargs: Unpack[GetObjectRequestTypeDef]) -> str:
        reponse = self.client.get_object(**kwargs)
        return reponse["Body"].read().decode("utf-8")

    @override
    def put(self, **kwargs: Unpack[PutObjectRequestTypeDef]) -> None:
        self.client.put_object(**kwargs)

    @override
    def delete(self, **kwargs: Unpack[DeleteObjectRequestTypeDef]) -> None:
        self.client.delete_object(**kwargs)

    @override
    def filter(self, bucket_name: str, prefix: str) -> list[Any]:
        bucket = self.resource.Bucket(bucket_name)
        return [obj for obj in bucket.objects.filter(Prefix=prefix)]

    @override
    def bulk_delete(
        self, bucket_name: str, objects: list[Any], quiet: bool = True
    ) -> Optional[DeleteObjectsOutputTypeDef]:
        delete_keys: DeleteTypeDef = {
            "Objects": [{"Key": obj.key} for obj in objects],
            "Quiet": quiet,
        }
        if delete_keys["Objects"]:
            return self.client.delete_objects(
                Bucket=bucket_name,
                Delete=delete_keys,
            )
        return None
