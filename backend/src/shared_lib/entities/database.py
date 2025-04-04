from collections.abc import Mapping
from typing import Any

from pydantic import BaseModel
from types_boto3_dynamodb.type_defs import (
    TableAttributeValueTypeDef,
)


class UpdateAttrsInput(BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    key: Mapping[str, TableAttributeValueTypeDef]
    attrs: dict[str, Any]
    update_expression_path: str | None = None
    expression_attribute_names: dict[str, str] | None = None
