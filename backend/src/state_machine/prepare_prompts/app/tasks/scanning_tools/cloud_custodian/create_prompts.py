import logging
from typing import override

from common.config import CLOUD_CUSTODIAN_PATH, S3_BUCKET
from common.entities import PromptS3Uri
from common.task import CreatePromptsTask
from services.storage import IStorageService
from types_boto3_s3.service_resource import ObjectSummary
from utils.questions import QuestionSet

from state_machine.event import CreatePromptsInput

logger = logging.getLogger("CreateCloudCustodianPrompts")
logger.setLevel(logging.DEBUG)


class CreateCloudCustodianPrompts(CreatePromptsTask):
    def __init__(self, storage_service: IStorageService, question_set: QuestionSet) -> None:
        super().__init__(storage_service, question_set)

    def retrieve_policies(self, assessment_id: str) -> list[ObjectSummary]:
        return self.storage_service.filter(bucket_name=S3_BUCKET, prefix=CLOUD_CUSTODIAN_PATH.format(assessment_id))

    def retrieve_policies_resources(self, policies: list[ObjectSummary]) -> list[str]:
        policies_filtered = filter(lambda policy: policy.key.endswith("resources.json"), policies)
        policies_resources: list[str] = []
        for policy in policies_filtered:
            policy_resources = self.storage_service.get(Bucket=S3_BUCKET, Key=policy.key)
            policies_resources.append(policy_resources)
        return policies_resources

    @override
    def execute(self, event: CreatePromptsInput) -> list[PromptS3Uri]:
        policies = self.retrieve_policies(event.assessment_id)
        policies_resources = self.retrieve_policies_resources(policies)
        logger.info("Retrieved : %s", policies_resources)
        return []
