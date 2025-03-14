from pathlib import Path
from unittest.mock import MagicMock

from services.scanning_tools.cloudsploit import CloudSploitService
from utils.tests import load_file

from tests.__mocks__.fake_storage_service import FakeStorageService


def test_cloudsploit_retrieve_findings():
    fake_storage_service = FakeStorageService()
    fake_storage_service.get = MagicMock(return_value=load_file(Path(__file__).parent / "cloudsploit_output.json"))

    service = CloudSploitService(storage_service=fake_storage_service)

    findings = service.retrieve_findings(assessment_id="test-assessment-id")

    fake_storage_service.get.assert_called_once_with(Bucket="test-bucket", Key="test-key")

    assert findings == []
