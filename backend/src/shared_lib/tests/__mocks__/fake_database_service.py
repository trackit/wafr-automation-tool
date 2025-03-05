from collections.abc import Mapping
from typing import Any, Unpack, override

from services.database import IDatabaseService
from types_boto3_dynamodb.type_defs import (
    GetItemInputTableGetItemTypeDef,
    QueryInputTableQueryTypeDef,
    TableAttributeValueTypeDef,
    UpdateItemInputTableUpdateItemTypeDef,
)


class FakeDatabaseService(IDatabaseService):
    @override
    def get(
        self,
        table_name: str,
        **kwargs: Unpack[GetItemInputTableGetItemTypeDef],
    ) -> dict[str, TableAttributeValueTypeDef] | None:
        raise NotImplementedError

    @override
    def update(
        self,
        table_name: str,
        **kwargs: Unpack[UpdateItemInputTableUpdateItemTypeDef],
    ) -> None:
        raise NotImplementedError

    @override
    def update_attrs(
        self,
        table_name: str,
        key: Mapping[str, TableAttributeValueTypeDef],
        attrs: dict[str, Any],
    ) -> None:
        raise NotImplementedError

    @override
    def put(self, table_name: str, item: dict[str, Any]) -> None:
        raise NotImplementedError

    @override
    def delete(
        self,
        table_name: str,
        key: Mapping[str, TableAttributeValueTypeDef],
    ) -> None:
        raise NotImplementedError

    @override
    def query(
        self,
        table_name: str,
        **kwargs: Unpack[QueryInputTableQueryTypeDef],
    ) -> list[dict[str, TableAttributeValueTypeDef]]:
        raise NotImplementedError

    @override
    def bulk_put(self, table_name: str, items: list[dict[str, Any]]) -> None:
        raise NotImplementedError

    @override
    def bulk_delete(self, table_name: str, keys: list[dict[str, Any]]) -> None:
        raise NotImplementedError
