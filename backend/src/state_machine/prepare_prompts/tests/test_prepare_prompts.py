from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY, PROWLER_OCSF_PATH, S3_BUCKET, STORE_PROMPT_PATH
from entities.database import UpdateAttrsInput
from entities.scanning_tools import ScanningTool
from exceptions.scanning_tool import InvalidScanningToolError
from tests.__mocks__.fake_database_service import FakeDatabaseService
from tests.__mocks__.fake_storage_service import FakeStorageService
from utils.tests import load_file

from state_machine.event import PreparePromptsInput


@patch("utils.files.get_prompt", return_value="prompt")
def test_prepare_prompts(get_prompt_mock: MagicMock):
    from ..app.tasks.prepare_prompts import PreparePrompts

    event = PreparePromptsInput(assessment_id="test_assessment_id", scanning_tool=ScanningTool.PROWLER, regions=[])

    fake_database_service = FakeDatabaseService()
    fake_database_service.update_attrs = MagicMock()

    fake_storage_service = FakeStorageService()
    fake_storage_service.get = MagicMock(return_value=load_file(Path(__file__).parent / "prowler_output.json"))
    fake_storage_service.put = MagicMock()

    fake_question_set = MagicMock(
        data={
            "pillar-1": {
                "label": "Pillar 1",
                "questions": {
                    "question-1": {
                        "label": "Question 1",
                        "best_practices": {
                            "best-practice-1": {
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
        }
    )

    task = PreparePrompts(
        database_service=fake_database_service,
        storage_service=fake_storage_service,
        formatted_question_set=fake_question_set,
    )

    prompt_list = task.execute(event)

    fake_database_service.update_attrs.assert_called_once_with(
        table_name="test-table",
        event=UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test_assessment_id"},
            attrs={
                "findings": {
                    "pillar-1": {
                        "label": "Pillar 1",
                        "questions": {
                            "question-1": {
                                "label": "Question 1",
                                "best_practices": {
                                    "best-practice-1": {
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
                "question_version": fake_question_set.version,
            },
        ),
    )

    fake_storage_service.get.assert_called_once_with(
        Bucket=S3_BUCKET, Key=PROWLER_OCSF_PATH.format(event.assessment_id)
    )
    fake_storage_service.put.assert_called()

    assert prompt_list == [
        f"s3://{S3_BUCKET}/{STORE_PROMPT_PATH.format(event.assessment_id, 'prowler_0')}",
    ]


def test_prepare_prompts_invalid_scanning_tool():
    from ..app.tasks.prepare_prompts import PreparePrompts

    event = PreparePromptsInput(assessment_id="test_assessment_id", scanning_tool=ScanningTool._TEST, regions=[])  # noqa: SLF001

    task = PreparePrompts(database_service=MagicMock(), storage_service=MagicMock(), formatted_question_set=MagicMock())

    with pytest.raises(InvalidScanningToolError):
        task.execute(event)
