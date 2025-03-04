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
                body = json.dumps([item.dict() for item in self.body])
            elif isinstance(self.body, dict):
                body = json.dumps(self.body, separators=(",", ":"))
            else:
                body = json.dumps(self.body.dict(), separators=(",", ":"))
        return {
            "statusCode": self.status_code,
            "body": body,
        }
