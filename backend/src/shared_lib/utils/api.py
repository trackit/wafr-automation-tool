import json
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel


class APIResponseBody(BaseModel):
    pass


class DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any):
        if isinstance(o, Decimal):
            return int(o)
        return super(DecimalEncoder, self).default(o)


class APIResponse[T: Optional[APIResponseBody | list[Any]]](BaseModel):
    statusCode: int
    body: Optional[T]

    def build(self) -> dict[str, Any]:
        body = None
        if self.body is not None:
            if isinstance(self.body, list):
                body = [item.dict() for item in self.body]
            elif isinstance(self.body, dict):
                body = json.dumps(self.body, separators=(",", ":"))
            else:
                body = json.dumps(self.body.dict(), separators=(",", ":"))
        return {
            "statusCode": self.statusCode,
            "body": body,
        }
