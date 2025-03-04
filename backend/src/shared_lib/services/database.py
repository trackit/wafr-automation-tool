from abc import ABC, abstractmethod
from collections.abc import Mapping
from typing import Any, Unpack, override

from botocore.exceptions import ClientError
from types_boto3_dynamodb import DynamoDBServiceResource
from types_boto3_dynamodb.type_defs import (
    GetItemInputTableGetItemTypeDef,
    QueryInputTableQueryTypeDef,
    TableAttributeValueTypeDef,
    UpdateItemInputTableUpdateItemTypeDef,
)


class IDatabaseService(ABC):
    @abstractmethod
    def get(
        self,
        table_name: str,
        **kwargs: Unpack[GetItemInputTableGetItemTypeDef],
    ) -> Mapping[str, TableAttributeValueTypeDef] | None:
        raise NotImplementedError

    @abstractmethod
    def update(
        self,
        table_name: str,
        **kwargs: Unpack[UpdateItemInputTableUpdateItemTypeDef],
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def put(self, table_name: str, item: dict[str, Any]) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete(
        self,
        table_name: str,
        key: Mapping[str, TableAttributeValueTypeDef],
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def query(
        self,
        table_name: str,
        **kwargs: Unpack[QueryInputTableQueryTypeDef],
    ) -> list[dict[str, TableAttributeValueTypeDef]]:
        raise NotImplementedError

    @abstractmethod
    def bulk_put(self, table_name: str, items: list[dict[str, Any]]) -> None:
        raise NotImplementedError

    @abstractmethod
    def bulk_delete(self, table_name: str, keys: list[dict[str, Any]]) -> None:
        raise NotImplementedError


class DDBService(IDatabaseService):
    def __init__(self, resource: DynamoDBServiceResource) -> None:
        super().__init__()
        self.resource = resource

    @override
    def get(
        self,
        table_name: str,
        **kwargs: Unpack[GetItemInputTableGetItemTypeDef],
    ) -> Mapping[str, TableAttributeValueTypeDef] | None:
        try:
            table = self.resource.Table(table_name)
            response = table.get_item(**kwargs)
            item = response.get("Item")
        except ClientError as e:
            raise e
        else:
            return item

    @override
    def update(
        self,
        table_name: str,
        **kwargs: Unpack[UpdateItemInputTableUpdateItemTypeDef],
    ) -> None:
        try:
            table = self.resource.Table(table_name)
            table.update_item(**kwargs)
        except ClientError as e:
            raise e

    @override
    def put(self, table_name: str, item: dict[str, Any]) -> None:
        try:
            table = self.resource.Table(table_name)
            table.put_item(Item=item)
        except ClientError as e:
            raise e

    @override
    def delete(
        self,
        table_name: str,
        key: Mapping[str, TableAttributeValueTypeDef],
    ) -> None:
        table = self.resource.Table(table_name)
        try:
            table.delete_item(Key=key)
        except ClientError as e:
            raise e

    @override
    def query(
        self,
        table_name: str,
        **kwargs: Unpack[QueryInputTableQueryTypeDef],
    ) -> list[dict[str, TableAttributeValueTypeDef]]:
        table = self.resource.Table(table_name)
        try:
            response = table.query(**kwargs)
            items = response["Items"]
            while "LastEvaluatedKey" in response:
                kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
                response = table.query(**kwargs)
                items.extend(response["Items"])
        except ClientError as e:
            raise e
        else:
            return items

    @override
    def bulk_put(self, table_name: str, items: list[dict[str, Any]]) -> None:
        table = self.resource.Table(table_name)
        try:
            with table.batch_writer() as batch:
                for item in items:
                    batch.put_item(Item=item)
        except ClientError as e:
            raise e

    @override
    def bulk_delete(self, table_name: str, keys: list[dict[str, Any]]) -> None:
        table = self.resource.Table(table_name)
        try:
            with table.batch_writer() as batch:
                for key in keys:
                    batch.delete_item(Key=key)
        except ClientError as e:
            raise e
