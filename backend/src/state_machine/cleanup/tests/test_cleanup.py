from unittest.mock import MagicMock, call

from common.entities import AssessmentDto
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

    storage_service.delete.assert_called_once_with(Bucket="NONE", Key="scans/ID/prowler/json-ocsf/output.ocsf.json")
    storage_service.filter.assert_has_calls([call("NONE", "scans/ID/prowler/compliance/output"), call("NONE", "ID")])
    storage_service.bulk_delete.assert_has_calls([call("NONE", ["TEST"]), call("NONE", ["TEST"])])


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
        "ID", AssessmentDto(name=None, role=None, step=-1, question_version=None, findings=None)
    )
    storage_service.delete.assert_called_once_with(Bucket="NONE", Key="scans/ID/prowler/json-ocsf/output.ocsf.json")
    storage_service.filter.assert_has_calls([call("NONE", "scans/ID/prowler/compliance/output"), call("NONE", "ID")])
    storage_service.bulk_delete.assert_has_calls([call("NONE", ["TEST"]), call("NONE", ["TEST"])])
