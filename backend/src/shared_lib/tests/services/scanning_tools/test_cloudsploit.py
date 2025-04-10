from pathlib import Path
from unittest.mock import MagicMock

from common.config import CLOUDSPLOIT_OUTPUT_PATH, S3_BUCKET
from entities.finding import FindingExtra, FindingResource
from services.scanning_tools.cloudsploit import CloudSploitService
from utils.tests import load_file

from tests.__mocks__.fake_storage_service import FakeStorageService


def test_cloudsploit_retrieve_findings():
    fake_storage_service = FakeStorageService()
    fake_storage_service.get = MagicMock(return_value=load_file(Path(__file__).parent / "cloudsploit_output.json"))

    service = CloudSploitService(storage_service=fake_storage_service)

    findings = service.retrieve_findings(assessment_id="test-assessment-id", regions=[])

    fake_storage_service.get.assert_called_once_with(
        Bucket=S3_BUCKET, Key=CLOUDSPLOIT_OUTPUT_PATH.format("test-assessment-id")
    )

    assert findings == [
        FindingExtra(
            id="1",
            status_code=None,
            status_detail="Access Analyzer is not configured",
            severity=None,
            resources=[FindingResource(uid=None, name=None, type=None, region="us-east-1")],
            remediation=None,
            risk_details="Ensure that IAM Access analyzer is enabled for all regions.",
            hidden=False,
        ),
    ]
