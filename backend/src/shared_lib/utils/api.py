import json
from decimal import Decimal
from typing import Any, override

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


class UnauthorizedError(Exception):
    def __init__(self, message: str = "Unauthorized: missing or invalid token") -> None:
        self.message = message
        super().__init__(self.message)


def get_bearer_token(event: dict[str, Any]) -> str:
    headers = event.get("headers") or {}
    auth_header = headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer ") or auth_header == "Bearer ":
        raise UnauthorizedError

    return auth_header.removeprefix("Bearer ")
