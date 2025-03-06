from decimal import Decimal
from http.client import OK
from typing import Any

from utils.api import APIResponse, APIResponseBody


def test_api():
    api_response = APIResponse[None](status_code=OK, body=None)
    assert api_response.status_code == OK
    assert not api_response.body


def test_api_build():
    api_response = APIResponse[None](status_code=OK, body=None)
    result: dict[str, Any] = api_response.build()
    assert result.get("statusCode") == OK
    assert not result.get("body")
    assert api_response.status_code == OK
    assert not api_response.body


def test_api_build_with_json():
    api_response_body = APIResponseBody()
    api_response = APIResponse[APIResponseBody](status_code=OK, body=api_response_body)
    result: dict[str, Any] = api_response.build()
    assert result.get("statusCode") == OK
    assert result.get("body") == "{}"
    assert api_response.status_code == OK
    assert api_response.body == api_response_body


def test_api_build_with_list_class():
    api_response_body = [APIResponseBody()]
    api_response = APIResponse[list[APIResponseBody]](status_code=OK, body=api_response_body)
    result: dict[str, Any] = api_response.build()
    assert result.get("statusCode") == OK
    assert result.get("body") == "[{}]"
    assert api_response.status_code == OK
    assert api_response.body == api_response_body


def test_api_build_with_list_dict():
    api_response_body = [{}]
    api_response = APIResponse[list[dict[str, Any]]](status_code=OK, body=api_response_body)
    result: dict[str, Any] = api_response.build()
    assert result.get("statusCode") == OK
    assert result.get("body") == "[{}]"
    assert api_response.status_code == OK
    assert api_response.body == api_response_body


class APIResponseBodyFixture(APIResponseBody):
    test: Decimal


def test_api_build_with_json_decimal():
    api_response_body = APIResponseBodyFixture(test=Decimal("1.0"))
    api_response = APIResponse[APIResponseBodyFixture](status_code=OK, body=api_response_body)
    result: dict[str, Any] = api_response.build()
    assert result.get("statusCode") == OK
    assert result.get("body") == '{"test":1}'
    assert api_response.status_code == OK
    assert api_response.body == api_response_body


def test_api_build_with_list_decimal():
    api_response_body = [Decimal("1.0")]
    api_response = APIResponse[list[Decimal]](status_code=OK, body=api_response_body)
    result: dict[str, Any] = api_response.build()
    assert result.get("statusCode") == OK
    assert result.get("body") == "[1]"
    assert api_response.status_code == OK
    assert api_response.body == api_response_body
