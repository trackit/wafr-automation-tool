from http.client import NOT_FOUND, OK
from unittest.mock import MagicMock

from common.entities import Assessment, PaginationOutput
from common.enums import Steps
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from api.event import RetrieveAllAssessmentsInput, RetrieveAllAssessmentsResponseBody

from ..app.tasks.retrieve_all_assessments import RetrieveAllAssessments


def test_retrieve_all_assessments():
    assessments = [
        Assessment(
            id="AID",
            name="AN",
            role_arn="AR",
            step=Steps.SCANNING_STARTED,
            created_at="",
            question_version="QV",
            findings=None,
        )
    ]
    assessments_dicts = [assessment.model_dump(exclude_none=True) for assessment in assessments]
    assessments_dicts[0]["error"] = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_paginated = MagicMock(
        return_value=PaginationOutput[Assessment](items=assessments, start_key=None)
    )

    task = RetrieveAllAssessments(assessment_service)
    task_input = RetrieveAllAssessmentsInput(limit=10, search=None, start_key=None, api_id="")
    response = task.execute(task_input)

    assessment_service.retrieve_paginated.assert_called_once()
    assert response.status_code == OK
    assert response.body == RetrieveAllAssessmentsResponseBody(assessments=assessments_dicts, nextUrl=None)


def test_retrieve_all_assessments_not_found():
    assessments = None
    assessment_service = FakeAssessmentService()
    assessment_service.retrieve_paginated = MagicMock(
        return_value=PaginationOutput[Assessment](items=[], start_key=None)
    )

    task = RetrieveAllAssessments(assessment_service)
    task_input = RetrieveAllAssessmentsInput(limit=10, search=None, start_key=None, api_id="")
    response = task.execute(task_input)

    assessment_service.retrieve_paginated.assert_called_once()
    assert response.status_code == NOT_FOUND
    assert response.body == assessments
