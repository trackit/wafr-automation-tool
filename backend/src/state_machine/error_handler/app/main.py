from typing import Any

import boto3
from state_machine.config import (
    DDB_TABLE,
    PROWLER_COMPLIANCE_PATH,
    PROWLER_OCSF_PATH,
    REGION,
    S3_BUCKET,
)
from state_machine.event import StateMachineException

s3_client = boto3.client("s3")
s3_resource = boto3.resource("s3")
s3_bucket = s3_resource.Bucket(S3_BUCKET)
dynamodb_client = boto3.resource("dynamodb", region_name=REGION)
dynamodb_table = dynamodb_client.Table(DDB_TABLE)


def update_assessment_item(exception: StateMachineException) -> None:
    dynamodb_table.update_item(
        Key={"id": exception.id, "finding_id": "0"},
        UpdateExpression="SET step = :step",
        ExpressionAttributeValues={":step": exception.error.dict()},
    )


def clean_prowler_scan(exception: StateMachineException) -> None:
    prowler_key = PROWLER_OCSF_PATH.format(exception.id)
    prowler_compliance_key = PROWLER_COMPLIANCE_PATH.format(exception.id)
    s3_client.delete_object(Bucket=S3_BUCKET, Key=prowler_key)

    compliance_objects = s3_bucket.objects.filter(Prefix=prowler_compliance_key)
    delete_keys: dict[str, Any] = {
        "Objects": [{"Key": obj.key} for obj in compliance_objects],
        "Quiet": True,
    }
    if delete_keys["Objects"]:
        s3_client.delete_objects(Bucket=S3_BUCKET, Delete=delete_keys)  # type: ignore


def clean_assessment_dynamodb(exception: StateMachineException) -> None:
    response = dynamodb_table.query(
        KeyConditionExpression="id = :id",
        ExpressionAttributeValues={":id": exception.id},
    )
    items = response.get("Items", [])

    while "LastEvaluatedKey" in response:
        response = dynamodb_table.query(
            KeyConditionExpression="id = :id",
            ExpressionAttributeValues={":id": exception.id},
            ExclusiveStartKey=response["LastEvaluatedKey"],
        )
        items.extend(response.get("Items", []))

    with dynamodb_table.batch_writer() as batch:
        for item in items:
            if item.get("finding_id", "0") != "0":
                key = {"id": item["id"], "finding_id": item["finding_id"]}
                batch.delete_item(Key=key)


def clean_assessment(exception: StateMachineException) -> None:
    objects = s3_bucket.objects.filter(Prefix=str(exception.id))
    delete_keys: dict[str, Any] = {
        "Objects": [{"Key": obj.key} for obj in objects],
        "Quiet": True,
    }
    if delete_keys["Objects"]:
        s3_client.delete_objects(Bucket=S3_BUCKET, Delete=delete_keys)  # type: ignore
    clean_assessment_dynamodb(exception)


def lambda_handler(event: dict[str, Any], _context: Any) -> None:
    exception = StateMachineException(**event)

    update_assessment_item(exception)
    clean_prowler_scan(exception)
    clean_assessment(exception)
