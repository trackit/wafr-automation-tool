from pathlib import Path
from unittest.mock import MagicMock

from common.config import PROWLER_OCSF_PATH, S3_BUCKET
from common.entities import FindingExtra, FindingRemediation, FindingResource
from services.scanning_tools.prowler import ProwlerService
from utils.tests import load_file

from tests.__mocks__.fake_storage_service import FakeStorageService


def test_prowler_retrieve_findings():
    prowler_output = load_file(Path(__file__).parent / "prowler_output.json")
    fake_storage_service = FakeStorageService()
    fake_storage_service.get = MagicMock(return_value=prowler_output)

    service = ProwlerService(storage_service=fake_storage_service)

    findings = service.retrieve_findings(assessment_id="test-assessment-id")

    fake_storage_service.get.assert_called_once_with(
        Bucket=S3_BUCKET, Key=PROWLER_OCSF_PATH.format("test-assessment-id")
    )

    assert findings == [
        FindingExtra(
            id="1",
            status_code="FAIL",
            status_detail="IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
            severity="Low",
            resources=[
                FindingResource(
                    uid="arn:aws:accessanalyzer:ap-northeast-1:XXXXXXXXXXXX:analyzer/unknown",
                    name="analyzer/unknown",
                    type="Other",
                    region="ap-northeast-1",
                )
            ],
            remediation=FindingRemediation(
                desc="Enable IAM Access Analyzer for all accounts, create analyzer and take action over it is recommendations (IAM Access Analyzer is available at no additional cost).",
                references=[
                    "aws accessanalyzer create-analyzer --analyzer-name <NAME> --type <ACCOUNT|ORGANIZATION>",
                    "https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html",
                ],
            ),
            risk_details="AWS IAM Access Analyzer helps you identify the resources in your organization and accounts, such as Amazon S3 buckets or IAM roles, that are shared with an external entity. This lets you identify unintended access to your resources and data, which is a security risk. IAM Access Analyzer uses a form of mathematical analysis called automated reasoning, which applies logic and mathematical inference to determine all possible access paths allowed by a resource policy.",
            hidden=False,
        )
    ]
