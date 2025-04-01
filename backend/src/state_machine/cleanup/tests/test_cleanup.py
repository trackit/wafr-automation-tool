from unittest.mock import MagicMock, call

from common.config import PROWLER_COMPLIANCE_PATH, PROWLER_OCSF_PATH, S3_BUCKET
from common.entities import Assessment, AssessmentDto
from common.enums import Steps
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
    assessment_service.retrieve = MagicMock(return_value=MagicMock(id="ID"))

    cleanup_input = CleanupInput(assessment_id="ID")
    cleanup = Cleanup(storage_service, database_service, assessment_service)
    cleanup.update_assessment_item = MagicMock()
    cleanup.execute(cleanup_input)

    assessment_service.delete_findings.assert_not_called()
    assessment_service.retrieve.assert_called_once_with("ID")
    cleanup.update_assessment_item.assert_not_called()

    storage_service.delete.assert_called_once_with(Bucket=S3_BUCKET, Key=PROWLER_OCSF_PATH.format("ID"))
    storage_service.filter.assert_has_calls(
        [call(S3_BUCKET, PROWLER_COMPLIANCE_PATH.format("ID")), call(S3_BUCKET, "ID")]
    )
    storage_service.bulk_delete.assert_has_calls([call(S3_BUCKET, ["TEST"]), call(S3_BUCKET, ["TEST"])])


def test_cleanup_on_error():
    assessment = Assessment(
        id="test-assessment-id",
        name="test-assessment-name",
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={
            "pillar-1": {
                "id": "pillar-1",
                "label": "Pillar 1",
                "questions": {
                    "question-1": {
                        "id": "question-1",
                        "label": "Question 1",
                        "resolve": False,
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
                                "hidden_results": [],
                            }
                        },
                    }
                },
            }
        },
    )
    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    assessment_service = FakeAssessmentService()

    storage_service.delete = MagicMock()
    storage_service.filter = MagicMock(return_value=[MagicMock(key="TEST")])
    storage_service.bulk_delete = MagicMock()
    assessment_service.delete_findings = MagicMock()
    assessment_service.update = MagicMock()
    assessment_service.retrieve = MagicMock(return_value=assessment)

    cleanup_input = CleanupInput(assessment_id="ID", error=StateMachineError(Error="ERROR", Cause="CAUSE"))
    cleanup = Cleanup(storage_service, database_service, assessment_service)
    cleanup.execute(cleanup_input)

    assessment_service.delete_findings.assert_called_once_with(assessment)
    assessment_service.retrieve.assert_called_once_with("ID")
    assessment_service.update.assert_called_once_with(
        "ID",
        AssessmentDto(
            name=None,
            role_arn=None,
            step=Steps.ERRORED,
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
