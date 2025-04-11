from http.client import OK
from unittest.mock import MagicMock

from entities.api import APIPaginationOutput
from entities.assessment import Assessment, Steps
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RetrieveAllAssessmentsInput, RetrieveAllAssessmentsResponseBody

from ..app.tasks.retrieve_all_assessments import RetrieveAllAssessments


def test_retrieve_all_assessments():
    assessments = [
        Assessment(
            id="AID",
            name="AN",
            regions=["test-region"],
            role_arn="AR",
            workflow="test-workflow",
            step=Steps.SCANNING_STARTED,
            created_at="",
            question_version="QV",
            findings=None,
        )
    ]
    assessments_dicts = [assessment.model_dump(exclude_none=True) for assessment in assessments]
    assessments_dicts[0]["error"] = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_all = MagicMock(
        return_value=APIPaginationOutput[Assessment](items=assessments, next_token=None)
    )

    task = RetrieveAllAssessments(assessment_service)
    task_input = RetrieveAllAssessmentsInput(limit=10, search=None, next_token=None, api_id="")
    response = task.execute(task_input)

    assessment_service.retrieve_all.assert_called_once()
    assert response.status_code == OK
    assert response.body == RetrieveAllAssessmentsResponseBody(assessments=assessments_dicts, next_token=None)


def test_retrieve_all_assessments_not_found():
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_all = MagicMock(return_value=APIPaginationOutput[Assessment](items=[], next_token=None))

    task = RetrieveAllAssessments(assessment_service)
    task_input = RetrieveAllAssessmentsInput(limit=10, search=None, next_token=None, api_id="")
    response = task.execute(task_input)

    assessment_service.retrieve_all.assert_called_once()
    assert response.status_code == OK
    assert response.body == RetrieveAllAssessmentsResponseBody(assessments=[], next_token=None)


def test_retrieve_all_assessments_with_search():
    assessments = [
        Assessment(
            id="AID",
            name="AN",
            regions=["test-region"],
            role_arn="AR",
            workflow="test-workflow",
            step=Steps.SCANNING_STARTED,
            created_at="",
            question_version="QV",
            findings=None,
        )
    ]
    assessments_dicts = [assessment.model_dump(exclude_none=True) for assessment in assessments]
    assessments_dicts[0]["error"] = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_all = MagicMock(
        return_value=APIPaginationOutput[Assessment](items=assessments, next_token=None)
    )

    task = RetrieveAllAssessments(assessment_service)
    task_input = RetrieveAllAssessmentsInput(limit=10, search="AN", next_token=None, api_id="")
    response = task.execute(task_input)

    assessment_service.retrieve_all.assert_called_once()
    assert response.status_code == OK
    assert response.body == RetrieveAllAssessmentsResponseBody(assessments=assessments_dicts, next_token=None)
