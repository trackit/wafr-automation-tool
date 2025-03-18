from unittest.mock import MagicMock, call

from common.config import PROWLER_COMPLIANCE_PATH, PROWLER_OCSF_PATH, S3_BUCKET
from common.entities import AssessmentDto
from common.enums import STEPS
from tests.__mocks__.fake_assessment_service import FakeAssessmentService
from tests.__mocks__.fake_database_service import FakeDatabaseService
from tests.__mocks__.fake_storage_service import FakeStorageService

from state_machine.event import CleanupInput, StateMachineError

from ..app.tasks.cleanup import Cleanup


def test_cleanup():
    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    assessment_service = FakeAssessmentService()

    storage_service.delete = MagicMock()
    storage_service.filter = MagicMock(return_value=[MagicMock(key="TEST")])
    storage_service.bulk_delete = MagicMock()
    assessment_service.delete_findings = MagicMock()

    cleanup_input = CleanupInput(assessment_id="ID")
    cleanup = Cleanup(storage_service, database_service, assessment_service)
    cleanup.update_assessment_item = MagicMock()
    cleanup.execute(cleanup_input)

    assessment_service.delete_findings.assert_not_called()
    cleanup.update_assessment_item.assert_not_called()

    storage_service.delete.assert_called_once_with(Bucket=S3_BUCKET, Key=PROWLER_OCSF_PATH.format("ID"))
    storage_service.filter.assert_has_calls(
        [call(S3_BUCKET, PROWLER_COMPLIANCE_PATH.format("ID")), call(S3_BUCKET, "ID")]
    )
    storage_service.bulk_delete.assert_has_calls([call(S3_BUCKET, ["TEST"]), call(S3_BUCKET, ["TEST"])])


def test_cleanup_on_error():
    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    assessment_service = FakeAssessmentService()

    storage_service.delete = MagicMock()
    storage_service.filter = MagicMock(return_value=[MagicMock(key="TEST")])
    storage_service.bulk_delete = MagicMock()
    assessment_service.delete_findings = MagicMock()
    assessment_service.update = MagicMock()

    cleanup_input = CleanupInput(assessment_id="ID", error=StateMachineError(Error="ERROR", Cause="CAUSE"))
    cleanup = Cleanup(storage_service, database_service, assessment_service)
    cleanup.execute(cleanup_input)

    assessment_service.delete_findings.assert_called_once_with("ID")
    assessment_service.update.assert_called_once_with(
        "ID",
        AssessmentDto(
            name=None,
            role_arn=None,
            step=STEPS.ERRORED,
            question_version=None,
            findings=None,
            error={"Error": "ERROR", "Cause": "CAUSE"},
        ),
    )
    storage_service.delete.assert_called_once_with(Bucket=S3_BUCKET, Key=PROWLER_OCSF_PATH.format("ID"))
    storage_service.filter.assert_has_calls(
        [call(S3_BUCKET, PROWLER_COMPLIANCE_PATH.format("ID")), call(S3_BUCKET, "ID")]
    )
    storage_service.bulk_delete.assert_has_calls([call(S3_BUCKET, ["TEST"]), call(S3_BUCKET, ["TEST"])])
