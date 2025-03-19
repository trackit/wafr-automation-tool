from unittest.mock import MagicMock

from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY
from common.entities import Assessment
from common.enums import Steps
from services.assessment import AssessmentService

from tests.__mocks__.fake_database_service import FakeDatabaseService


def test_assessment_service_retrieve():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: "ASSESSMENT",
            DDB_SORT_KEY: "test-assessment-id",
            "name": "test-assessment-name",
            "role_arn": "test-assessment-role",
            "step": Steps.FINISHED,
            "created_at": "",
            "question_version": "test-question-version",
            "findings": {
                "pillar-1": {
                    "question-1": {"best-practice-1": {"risk": "Low", "status": False, "results": ["1", "2", "3"]}}
                }
            },
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment = assessment_service.retrieve("test-assessment-id")
    assert assessment == Assessment(
        id="test-assessment-id",
        name="test-assessment-name",
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={
            "pillar-1": {
                "question-1": {"best-practice-1": {"risk": "Low", "status": False, "results": ["1", "2", "3"]}}
            }
        },
    )

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
    )
