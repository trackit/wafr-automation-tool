import json
from decimal import Decimal
from typing import Any, override

from exceptions.api import (
    EmailExtractionError,
    OrganizationExtractionError,
    UserIdExtractionError,
)
from pydantic import BaseModel


class APIResponseBody(BaseModel):
    pass


class DecimalEncoder(json.JSONEncoder):
    @override
    def default(self, o: Any) -> int:
        if isinstance(o, Decimal):
            return int(o)
        return super(__class__, self).default(o)


class APIResponse[T: APIResponseBody | list[Any] | None](BaseModel):
    status_code: int
    body: T | None

    def build(self) -> dict[str, Any]:
        body = None
        if self.body is not None:
            if isinstance(self.body, list):
                if isinstance(self.body[0], dict):
                    body = json.dumps(self.body, separators=(",", ":"), cls=DecimalEncoder)
                elif isinstance(self.body[0], BaseModel):
                    body = json.dumps(
                        [item.model_dump() for item in self.body],
                        separators=(",", ":"),
                        cls=DecimalEncoder,
                    )
                else:
                    body = json.dumps(self.body, separators=(",", ":"), cls=DecimalEncoder)
            else:
                body = json.dumps(self.body.model_dump(), separators=(",", ":"), cls=DecimalEncoder)
        return {
            "statusCode": self.status_code,
            "body": body,
            "headers": {
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "*",
                "access-control-allow-origin": "*",
                "access-control-expose-headers": "*",
                "access-control-allow-credentials": "true",
            },
        }


def get_user_organization_id(event: dict[str, Any]) -> str:
    try:
        return event["requestContext"]["authorizer"]["claims"]["email"].split("@")[1]
    except (KeyError, AttributeError, IndexError) as e:
        msg = event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("email", None)
        raise OrganizationExtractionError(msg) from e


def get_user_id(event: dict[str, Any]) -> str:
    try:
        return event["requestContext"]["authorizer"]["claims"]["sub"]
    except (KeyError, AttributeError, IndexError) as e:
        msg = event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("sub", None)
        raise UserIdExtractionError(msg) from e


def get_user_email(event: dict[str, Any]) -> str:
    try:
        return event["requestContext"]["authorizer"]["claims"]["email"]
    except (KeyError, AttributeError, IndexError) as e:
        msg = event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("email", None)
        raise EmailExtractionError(msg) from e
