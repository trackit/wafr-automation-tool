import json
from typing import override

from common.config import CLOUD_CUSTODIAN_PATH, S3_BUCKET
from entities.assessment import AssessmentID
from entities.finding import FindingExtra
from entities.scanning_tools import CloudCustodianPolicy, ScanningTool
from exceptions.scanning_tool import InvalidPolicyError
from types_boto3_s3.service_resource import ObjectSummary

from services.scanning_tools import IScanningToolService
from services.scanning_tools.cloud_custodian.policies.ec2_stopped_instance import EC2StoppedInstance
from services.scanning_tools.cloud_custodian.policy import Policy
from services.storage import IStorageService

CLOUD_CUSTODIAN_POLICIES: dict[str, type[Policy]] = {
    CloudCustodianPolicy.EC2_STOPPED_INSTANCE: EC2StoppedInstance,
}


class CloudCustodianService(IScanningToolService):
    def __init__(self, storage_service: IStorageService) -> None:
        super().__init__(storage_service=storage_service, name=ScanningTool.CLOUD_CUSTODIAN, title="Cloud Custodian")

    def retrieve_policies(self, assessment_id: AssessmentID) -> list[ObjectSummary]:
        return self.storage_service.filter(bucket_name=S3_BUCKET, prefix=CLOUD_CUSTODIAN_PATH.format(assessment_id))

    @override
    def retrieve_findings(self, assessment_id: AssessmentID) -> list[FindingExtra]:
        policies = self.retrieve_policies(assessment_id)
        policies_filtered = filter(lambda policy: policy.key.endswith("resources.json"), policies)
        policies_resources: list[FindingExtra] = []
        index_offset = 1
        for policy in policies_filtered:
            resources = self.storage_service.get(Bucket=S3_BUCKET, Key=policy.key)
            if resources is None:
                raise InvalidPolicyError(policy.key)
            resources_json = json.loads(resources)
            parser = CLOUD_CUSTODIAN_POLICIES.get(policy.key.split("/")[-2])
            if parser is None:
                raise InvalidPolicyError(policy.key.split("/")[-2])
            findings = parser().parse(index_offset, resources_json)
            index_offset += len(findings)
            policies_resources.extend(findings)
        return policies_resources
