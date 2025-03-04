from typing import override

from boto3.dynamodb.conditions import Key
from common.config import (
    DDB_ASSESSMENT_SK,
    DDB_KEY,
    DDB_SORT_KEY,
    DDB_TABLE,
    PROWLER_COMPLIANCE_PATH,
    PROWLER_OCSF_PATH,
    S3_BUCKET,
)
from common.task import Task
from services.database import IDatabaseService
from services.storage import IStorageService
from state_machine.event import StateMachineException


class ErrorHandler(Task[StateMachineException, None]):
    def __init__(
        self,
        storage_service: IStorageService,
        database_service: IDatabaseService,
    ) -> None:
        self.storage_service = storage_service
        self.database_service = database_service

    def update_assessment_item(self, exception: StateMachineException) -> None:
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: exception.id, DDB_SORT_KEY: DDB_ASSESSMENT_SK},
            UpdateExpression="SET step = :step",
            ExpressionAttributeValues={":step": exception.error.dict()},
        )

    def clean_prowler_scan(self, exception: StateMachineException) -> None:
        prowler_key = PROWLER_OCSF_PATH.format(exception.id)
        prowler_compliance_key = PROWLER_COMPLIANCE_PATH.format(exception.id)
        self.storage_service.delete(Bucket=S3_BUCKET, Key=prowler_key)

        compliance_objects = self.storage_service.filter(
            S3_BUCKET, prowler_compliance_key
        )
        self.storage_service.bulk_delete(S3_BUCKET, compliance_objects)

    def clean_assessment_dynamodb(self, exception: StateMachineException) -> None:
        items = self.database_service.query(
            table_name=DDB_TABLE,
            KeyConditionExpression=Key(DDB_KEY).eq(exception.id),
        )
        if not items:
            return
        keys = [
            {DDB_KEY: item["id"], DDB_SORT_KEY: item["finding_id"]} for item in items
        ]
        self.database_service.bulk_delete(table_name=DDB_TABLE, keys=keys)

    def clean_assessment(self, exception: StateMachineException) -> None:
        objects = self.storage_service.filter(S3_BUCKET, str(exception.id))
        self.storage_service.bulk_delete(S3_BUCKET, objects)
        self.clean_assessment_dynamodb(exception)

    @override
    def execute(self, event: StateMachineException) -> None:
        self.update_assessment_item(event)
        self.clean_prowler_scan(event)
        self.clean_assessment(event)
