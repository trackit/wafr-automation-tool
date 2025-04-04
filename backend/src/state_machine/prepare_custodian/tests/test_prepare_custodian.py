from unittest.mock import MagicMock, patch

from common.config import CUSTODIAN_FILE_NAME, S3_BUCKET
from tests.__mocks__.fake_storage_service import FakeStorageService


@patch("utils.files.get_custodian_policies", return_value="policies")
def test_prepare_custodian(get_custodian_policies_mock: MagicMock):
    from ..app.tasks.prepare_custodian import PrepareCustodian

    fake_storage_service = FakeStorageService()
    fake_storage_service.put = MagicMock()

    task = PrepareCustodian(fake_storage_service)
    custodian_uri = task.execute(None)

    fake_storage_service.put.assert_called_once_with(Bucket=S3_BUCKET, Key=CUSTODIAN_FILE_NAME, Body="policies")
    assert custodian_uri == f"s3://{S3_BUCKET}/{CUSTODIAN_FILE_NAME}"
