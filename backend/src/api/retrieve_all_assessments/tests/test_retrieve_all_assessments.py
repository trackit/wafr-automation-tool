from unittest.mock import MagicMock

from common.entities import Assessment
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from ..app.tasks.retrieve_all_assessments import RetrieveAllAssessments


def test_retrieve_all_assessments():
    assessments = [Assessment(id="AID", name="AN", role="AR", step=0, question_version="QV", findings=None)]
    assessments_dicts = [assessment.model_dump(exclude_none=True) for assessment in assessments]
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_all = MagicMock(return_value=assessments)

    task = RetrieveAllAssessments(assessment_service)
    response = task.execute(None)

    assessment_service.retrieve_all.assert_called_once()
    assert response.status_code == 200
    assert response.body == assessments_dicts
