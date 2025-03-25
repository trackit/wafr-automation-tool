import os

import boto3
import pytest
from botocore.exceptions import ClientError
from moto import mock_aws
from services.storage import S3Service
from types_boto3_s3 import S3Client, S3ServiceResource


@pytest.fixture(autouse=True)
def aws_credentials():
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def s3_client():
    with mock_aws():
        s3_client = boto3.client("s3")
        s3_client.create_bucket(Bucket="test-bucket")
        s3_client.put_object(Bucket="test-bucket", Key="test-key", Body="test-body")
        yield s3_client


@pytest.fixture
def s3_resource():
    with mock_aws():
        s3_resource = boto3.resource("s3")
        yield s3_resource


@pytest.fixture
def s3_service(s3_client: S3Client, s3_resource: S3ServiceResource):
    return S3Service(s3_client, s3_resource)


def test_s3_service_get(s3_service: S3Service):
    data = s3_service.get(Bucket="test-bucket", Key="test-key")
    assert data == "test-body"

    with pytest.raises(ClientError):
        s3_service.get(Bucket="test-bucket", Key="test-key-inexistent")


def test_s3_service_put(s3_client: S3Client, s3_service: S3Service):
    s3_service.put(Bucket="test-bucket", Key="test-key-put", Body="test-body-put")

    data = s3_client.get_object(Bucket="test-bucket", Key="test-key-put")
    assert data["Body"].read().decode("utf-8") == "test-body-put"


def test_s3_service_delete(s3_client: S3Client, s3_service: S3Service):
    s3_service.delete(Bucket="test-bucket", Key="test-key")

    with pytest.raises(ClientError):
        s3_client.get_object(Bucket="test-bucket", Key="test-key")


def test_s3_service_filter(s3_client: S3Client, s3_service: S3Service):
    objects = s3_service.filter(bucket_name="test-bucket", prefix="test-key")

    assert len(objects) == 1
    assert [obj.key for obj in objects] == ["test-key"]

    s3_client.put_object(Bucket="test-bucket", Key="test-key-2", Body="test-body-2")
    objects = s3_service.filter(bucket_name="test-bucket", prefix="test-key")

    assert len(objects) == 2
    assert [obj.key for obj in objects] == ["test-key", "test-key-2"]


def test_s3_service_bulk_delete(s3_client: S3Client, s3_service: S3Service):
    keys = [
        "test-key-1",
        "test-key-2",
        "test-key-3",
        "test-key-4",
        "test-key-5",
    ]

    for key in keys:
        s3_client.put_object(Bucket="test-bucket", Key=key, Body="test-body")

    s3_service.bulk_delete(bucket_name="test-bucket", keys=keys)

    for key in keys:
        with pytest.raises(ClientError):
            s3_client.get_object(Bucket="test-bucket", Key=key)


def test_s3_service_delete_bucket_empty(s3_service: S3Service):
    keys = []
    assert s3_service.bulk_delete(bucket_name="test-bucket", keys=keys) is None
