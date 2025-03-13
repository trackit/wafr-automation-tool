from http.client import INTERNAL_SERVER_ERROR, OK
from unittest.mock import MagicMock

from common.config import STEP_START_SCANNING
from common.entities import Assessment
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from ..app.tasks.retrieve_all_assessments import RetrieveAllAssessments


def test_retrieve_all_assessments():
    assessments = [
        Assessment(id="AID", name="AN", role="AR", step=STEP_START_SCANNING, question_version="QV", findings=None)
    ]
    assessments_dicts = [assessment.model_dump(exclude_none=True) for assessment in assessments]
    assessments_dicts[0]["error"] = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_all = MagicMock(return_value=assessments)

    task = RetrieveAllAssessments(assessment_service)
    response = task.execute(None)

    assessment_service.retrieve_all.assert_called_once()
    assert response.status_code == OK
    assert response.body == assessments_dicts


def test_retrieve_all_assessments_not_found():
    assessments = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_all = MagicMock(return_value=assessments)

    task = RetrieveAllAssessments(assessment_service)
    response = task.execute(None)

    assessment_service.retrieve_all.assert_called_once()
    assert response.status_code == INTERNAL_SERVER_ERROR
    assert response.body == assessments
