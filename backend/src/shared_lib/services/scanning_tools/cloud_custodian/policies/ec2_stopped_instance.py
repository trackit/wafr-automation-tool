from typing import override

from common.entities import FindingExtra, FindingResource

from services.scanning_tools.cloud_custodian.policy import Policy


class EC2StoppedInstance(Policy):
    @override
    def parse_finding(self, finding_id: str, finding: dict) -> FindingExtra:
        region = finding.get("Placement", {})
        region = region.get("AvailabilityZone", {})
        return FindingExtra(
            id=finding_id,
            status_code="FAIL",
            status_detail="EC2 is stopped but not terminated",
            severity="Low",
            resources=[
                FindingResource(
                    uid=finding.get("InstanceId"), name=finding.get("InstanceId"), region=region, type="aws.ec2"
                )
            ],
            risk_details=(
                "The EC2 instance is stopped but not terminated, which may lead to unnecessary costs due to idle "
                "resources. Additionally, stopped instances may still have associated volumes, security groups, and "
                "other resources that could pose a security risk if not managed properly. It is recommended to either "
                "terminate the instance or ensure proper management of resources to prevent any potential security or "
                "cost-related issues."
            ),
            hidden=False,
        )
