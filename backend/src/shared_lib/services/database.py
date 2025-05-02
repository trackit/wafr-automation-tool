import logging
from abc import ABC, abstractmethod
from collections.abc import Mapping
from typing import Any, Unpack, override

from botocore.exceptions import ClientError
from entities.database import UpdateAttrsInput
from exceptions.database import DynamoDBError
from types_boto3_dynamodb import DynamoDBServiceResource
from types_boto3_dynamodb.type_defs import (
    GetItemInputTableGetItemTypeDef,
    QueryInputTableQueryTypeDef,
    QueryOutputTableTypeDef,
    TableAttributeValueTypeDef,
    UpdateItemInputTableUpdateItemTypeDef,
)

logger = logging.getLogger("DatabaseService")


class IDatabaseService(ABC):
    @abstractmethod
    def get(
        self,
        table_name: str,
        **kwargs: Unpack[GetItemInputTableGetItemTypeDef],
    ) -> dict[str, TableAttributeValueTypeDef] | None:
        raise NotImplementedError

    @abstractmethod
    def update(
        self,
        table_name: str,
        **kwargs: Unpack[UpdateItemInputTableUpdateItemTypeDef],
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_attrs(
        self,
        table_name: str,
        event: UpdateAttrsInput,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_list_attrs(
        self,
        table_name: str,
        event: UpdateAttrsInput,
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
    def query_all(
        self,
        table_name: str,
        **kwargs: Unpack[QueryInputTableQueryTypeDef],
    ) -> list[dict[str, TableAttributeValueTypeDef]]:
        raise NotImplementedError

    @abstractmethod
    def query(
        self,
        table_name: str,
        **kwargs: Unpack[QueryInputTableQueryTypeDef],
    ) -> QueryOutputTableTypeDef:
        raise NotImplementedError

    @abstractmethod
    def bulk_get(
        self,
        table_name: str,
        keys: list[dict[str, TableAttributeValueTypeDef]],
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
    ) -> dict[str, TableAttributeValueTypeDef] | None:
        try:
            table = self.resource.Table(table_name)
            response = table.get_item(**kwargs)
            item = response.get("Item")
        except ClientError as e:
            logger.exception("Error while getting item from DynamoDB")
            raise DynamoDBError from e
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
            logger.exception("Error while updating item in DynamoDB")
            raise DynamoDBError from e

    @override
    def update_attrs(
        self,
        table_name: str,
        event: UpdateAttrsInput,
    ) -> None:
        update_expression = "SET "
        expression_attribute_names = event.expression_attribute_names or {}
        expression_attribute_values = {}
        for original_attr_name, attr_value in event.attrs.items():
            attr_name = original_attr_name.replace("-", "_")
            update_expression += f"{event.update_expression_path or ''}#{attr_name} = :{attr_name}, "
            expression_attribute_names[f"#{attr_name}"] = attr_name
            expression_attribute_values[f":{attr_name}"] = attr_value
        update_params: UpdateItemInputTableUpdateItemTypeDef = {
            "Key": event.key,
            "UpdateExpression": update_expression[:-2],
            "ExpressionAttributeNames": expression_attribute_names,
            "ExpressionAttributeValues": expression_attribute_values,
        }
        self.update(table_name, **update_params)

    @override
    def update_list_attrs(
        self,
        table_name: str,
        event: UpdateAttrsInput,
    ) -> None:
        update_expression = "SET "
        expression_attribute_names = event.expression_attribute_names or {}
        expression_attribute_values = {
            ":empty_list": [],
        }
        for attr_name, attr_value in event.attrs.items():
            update_expression += f"{event.update_expression_path or ''}#{attr_name} = list_append(if_not_exists({event.update_expression_path or ''}#{attr_name}, :empty_list), :{attr_name}), "  # noqa: E501
            expression_attribute_names[f"#{attr_name}"] = attr_name
            expression_attribute_values[f":{attr_name}"] = attr_value
        update_params: UpdateItemInputTableUpdateItemTypeDef = {
            "Key": event.key,
            "UpdateExpression": update_expression[:-2],
            "ExpressionAttributeNames": expression_attribute_names,
            "ExpressionAttributeValues": expression_attribute_values,
        }
        self.update(table_name, **update_params)

    @override
    def put(self, table_name: str, item: dict[str, Any]) -> None:
        try:
            table = self.resource.Table(table_name)
            table.put_item(Item=item)
        except ClientError as e:
            logger.exception("Error while putting item in DynamoDB")
            raise DynamoDBError from e

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
            logger.exception("Error while deleting item from DynamoDB")
            raise DynamoDBError from e

    @override
    def query_all(
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
            logger.exception("Error while querying DynamoDB")
            raise DynamoDBError from e
        else:
            return items

    @override
    def query(
        self,
        table_name: str,
        **kwargs: Unpack[QueryInputTableQueryTypeDef],
    ) -> QueryOutputTableTypeDef:
        table = self.resource.Table(table_name)
        items = []
        limit = kwargs.get("Limit", 100)
        try:
            response = table.query(**kwargs)
            items.extend(response["Items"])
            while "LastEvaluatedKey" in response and len(items) < limit:
                kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
                kwargs["Limit"] = limit - len(items)
                response = table.query(**kwargs)
                items.extend(response["Items"])
        except ClientError as e:
            logger.exception("Error while querying DynamoDB")
            raise DynamoDBError from e
        else:
            response["Items"] = items
            return response

    @override
    def bulk_get(
        self,
        table_name: str,
        keys: list[dict[str, TableAttributeValueTypeDef]],
    ) -> list[dict[str, TableAttributeValueTypeDef]]:
        try:
            split_keys = [keys[i : i + 100] for i in range(0, len(keys), 100)]
            items = []
            for split_key in split_keys:
                response = self.resource.batch_get_item(RequestItems={table_name: {"Keys": split_key}})
                items.extend(response["Responses"].get(table_name, []))
        except ClientError as e:
            logger.exception("Error while bulk getting items from DynamoDB")
            raise DynamoDBError from e
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
            logger.exception("Error while bulk putting items in DynamoDB")
            raise DynamoDBError from e

    @override
    def bulk_delete(self, table_name: str, keys: list[dict[str, Any]]) -> None:
        table = self.resource.Table(table_name)
        try:
            with table.batch_writer() as batch:
                for key in keys:
                    batch.delete_item(Key=key)
        except ClientError as e:
            logger.exception("Error while bulk deleting items from DynamoDB")
            raise DynamoDBError from e
