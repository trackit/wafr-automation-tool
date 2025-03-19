import os

import boto3
import pytest
from boto3.dynamodb.conditions import Key
from common.config import DDB_KEY, DDB_SORT_KEY
from exceptions.database import DynamoDBError
from moto import mock_aws
from services.database import DDBService
from types_boto3_dynamodb import DynamoDBServiceResource


@pytest.fixture(autouse=True)
def aws_credentials():
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def ddb_resource():
    with mock_aws():
        dbb_resource = boto3.resource("dynamodb", region_name="us-east-1")
        table = dbb_resource.create_table(
            TableName="test-table",
            AttributeDefinitions=[
                {"AttributeName": DDB_KEY, "AttributeType": "S"},
                {"AttributeName": DDB_SORT_KEY, "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": DDB_KEY, "KeyType": "HASH"},
                {"AttributeName": DDB_SORT_KEY, "KeyType": "RANGE"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        table.put_item(Item={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
        yield dbb_resource


@pytest.fixture
def ddb_service(ddb_resource: DynamoDBServiceResource):
    return DDBService(ddb_resource)


def test_ddb_service_get(ddb_service: DDBService):
    item = ddb_service.get(table_name="test-table", Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert item == {DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"}

    item = ddb_service.get(table_name="test-table", Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk-inexistent"})
    assert item is None

    with pytest.raises(DynamoDBError):
        ddb_service.get(table_name="test-table-inexistent", Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})


def test_ddb_service_update(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    ddb_table = ddb_resource.Table("test-table")
    item = ddb_table.get_item(Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert "Item" in item
    assert item["Item"] == {DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"}

    ddb_service.update(
        table_name="test-table",
        Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"},
        UpdateExpression="SET #attr = :attr",
        ExpressionAttributeNames={"#attr": "attr"},
        ExpressionAttributeValues={":attr": "test-attr"},
    )

    item = ddb_table.get_item(Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert "Item" in item
    assert item["Item"] == {DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk", "attr": "test-attr"}

    with pytest.raises(DynamoDBError):
        ddb_service.update(
            table_name="test-table-inexistent",
            Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"},
            UpdateExpression="SET #attr = :attr",
            ExpressionAttributeNames={"#attr": "attr"},
            ExpressionAttributeValues={":attr": "test-attr"},
        )


def test_ddb_service_update_attrs(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    ddb_table = ddb_resource.Table("test-table")
    item = ddb_table.get_item(Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert "Item" in item
    assert item["Item"] == {DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"}

    ddb_service.update_attrs(
        table_name="test-table", key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"}, attrs={"attr": "test-attr"}
    )
    item = ddb_table.get_item(Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert "Item" in item
    assert item["Item"] == {DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk", "attr": "test-attr"}


def test_ddb_service_put(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    ddb_service.put(table_name="test-table", item={DDB_KEY: "test-pk-1", DDB_SORT_KEY: "test-sk-1"})

    item = ddb_resource.Table("test-table").get_item(Key={DDB_KEY: "test-pk-1", DDB_SORT_KEY: "test-sk-1"})
    assert "Item" in item
    assert item["Item"] == {DDB_KEY: "test-pk-1", DDB_SORT_KEY: "test-sk-1"}

    with pytest.raises(DynamoDBError):
        ddb_service.put(table_name="test-table-inexistent", item={DDB_KEY: "test-pk-1", DDB_SORT_KEY: "test-sk-1"})


def test_ddb_service_delete(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    ddb_table = ddb_resource.Table("test-table")
    item = ddb_table.get_item(Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert "Item" in item
    assert item["Item"] == {DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"}

    ddb_service.delete(table_name="test-table", key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})

    item = ddb_table.get_item(Key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})
    assert "Item" not in item

    with pytest.raises(DynamoDBError):
        ddb_service.delete(table_name="test-table-inexistent", key={DDB_KEY: "test-pk", DDB_SORT_KEY: "test-sk"})


def test_ddb_service_query(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    ddb_table = ddb_resource.Table("test-table")
    ddb_table.put_item(Item={DDB_KEY: "test-pk", DDB_SORT_KEY: "test#1"})
    ddb_table.put_item(Item={DDB_KEY: "test-pk", DDB_SORT_KEY: "test#2"})
    ddb_table.put_item(Item={DDB_KEY: "test-pk", DDB_SORT_KEY: "test#3"})
    ddb_table.put_item(Item={DDB_KEY: "test-pk-1", DDB_SORT_KEY: "test#4"})

    items = ddb_service.query_all(
        table_name="test-table",
        KeyConditionExpression=(Key(DDB_KEY).eq("test-pk") & Key(DDB_SORT_KEY).begins_with("test#")),
    )
    assert items == [
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#1"},
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#2"},
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#3"},
    ]

    items = ddb_service.query_all(
        table_name="test-table",
        KeyConditionExpression=Key(DDB_KEY).eq("test-pk-inexistent"),
    )
    assert not items

    with pytest.raises(DynamoDBError):
        ddb_service.query_all(table_name="test-table-inexistent", KeyConditionExpression=Key(DDB_KEY).eq("test-pk"))


def test_ddb_service_bulk_put(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    items = [
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#1"},
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#2"},
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#3"},
    ]
    ddb_service.bulk_put(table_name="test-table", items=items)

    ddb_table = ddb_resource.Table("test-table")
    for item in items:
        retrived_item = ddb_table.get_item(Key={DDB_KEY: item[DDB_KEY], DDB_SORT_KEY: item[DDB_SORT_KEY]})
        assert "Item" in retrived_item
        assert retrived_item["Item"] == item

    with pytest.raises(DynamoDBError):
        ddb_service.bulk_put(table_name="test-table-inexistent", items=items)


def test_ddb_service_bulk_delete(ddb_resource: DynamoDBServiceResource, ddb_service: DDBService):
    items = [
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#1"},
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#2"},
        {DDB_KEY: "test-pk", DDB_SORT_KEY: "test#3"},
    ]
    ddb_table = ddb_resource.Table("test-table")
    with ddb_table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

    ddb_service.bulk_delete(table_name="test-table", keys=items)
    for item in items:
        retrived_item = ddb_table.get_item(Key={DDB_KEY: item[DDB_KEY], DDB_SORT_KEY: item[DDB_SORT_KEY]})
        assert "Item" not in retrived_item

    with pytest.raises(DynamoDBError):
        ddb_service.bulk_delete(table_name="test-table-inexistent", keys=items)
