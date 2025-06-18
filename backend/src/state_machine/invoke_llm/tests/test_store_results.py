import json
from unittest.mock import MagicMock

import pytest
from common.config import ASSESSMENT_SK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE, FINDING_PK, FINDING_SK, STORE_CHUNK_PATH
from entities.finding import FindingExtra
from exceptions.ai import InvalidPromptResponseError
from tests.__mocks__.fake_database_service import FakeDatabaseService
from tests.__mocks__.fake_storage_service import FakeStorageService
from utils.questions import QuestionSetData

from state_machine.event import StoreResultsInput

from ..app.tasks.store_results import StoreResults


def test_store_results():
    llm_response = '[{"id":1,"start":10,"end":10}]'
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
        hidden=False,
        best_practices="pillar-1#question-1#best-practice-1",
    )
    database_service = FakeDatabaseService()
    storage_service = FakeStorageService()
    fake_question_set_data = {
        "pillar-1": {
            "id": "pillar-1",
            "label": "Pillar 1",
            "primary_id": "pillar-1",
            "disabled": False,
            "questions": {
                "question-1": {
                    "id": "question-1",
                    "label": "Question 1",
                    "primary_id": "question-1",
                    "none": False,
                    "disabled": False,
                    "best_practices": {
                        "best-practice-1": {
                            "id": "best-practice-1",
                            "primary_id": "best-practice-1",
                            "label": "Best Practice 1",
                            "description": "Best Practice 1 Description",
                            "risk": "High",
                            "status": False,
                            "results": ["prowler:1"],
                            "hidden_results": [],
                        }
                    },
                }
            },
        }
    }
    fake_question_set = MagicMock(
        data=QuestionSetData(
            **fake_question_set_data,
        )
    )

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.update = MagicMock(return_value=None)
    database_service.put = MagicMock(return_value=None)

    invoke_llm_input = StoreResultsInput(
        assessment_id="AID",
        organization="test-organization",
        llm_response=llm_response,
        prompt_uri="s3://bucket/prompts/prowler_0.json",
    )
    task = StoreResults(database_service, storage_service, fake_question_set)
    result = task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key=STORE_CHUNK_PATH.format("AID", "prowler_0"))
    database_service.update.assert_called_once()
    database_service.put.assert_called_once_with(
        table_name=DDB_TABLE,
        item={
            **finding.model_dump(),
            DDB_KEY: FINDING_PK.format(invoke_llm_input.organization, invoke_llm_input.assessment_id),
            DDB_SORT_KEY: FINDING_SK.format("prowler#10"),
        },
    )
    assert not result


def test_store_results_with_no_finding():
    llm_response = "[]"
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
        hidden=False,
    )
    database_service = FakeDatabaseService()
    database_service.update = MagicMock(return_value=None)

    storage_service = FakeStorageService()
    fake_question_set_data = {
        "pillar-1": {
            "id": "pillar-1",
            "label": "Pillar 1",
            "primary_id": "pillar-1",
            "disabled": False,
            "questions": {
                "question-1": {
                    "id": "question-1",
                    "label": "Question 1",
                    "primary_id": "question-1",
                    "none": False,
                    "disabled": False,
                    "best_practices": {
                        "best-practice-1": {
                            "id": "best-practice-1",
                            "primary_id": "best-practice-1",
                            "label": "Best Practice 1",
                            "description": "Best Practice 1 Description",
                            "risk": "High",
                            "status": False,
                            "results": ["1", "2", "3"],
                            "hidden_results": [],
                        }
                    },
                }
            },
        }
    }
    fake_question_set = MagicMock(
        data=QuestionSetData(
            **fake_question_set_data,
        )
    )

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))

    invoke_llm_input = StoreResultsInput(
        assessment_id="AID",
        organization="test-organization",
        llm_response=llm_response,
        prompt_uri="s3://bucket/prompts/prowler_0.json",
    )
    task = StoreResults(database_service, storage_service, fake_question_set)
    task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key=STORE_CHUNK_PATH.format("AID", "prowler_0"))
    database_service.update.assert_not_called()


def test_store_results_with_invalid_questions():
    llm_response = '[{"id":1,"start":10,"end":10}]'
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
        hidden=False,
    )

    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    questions = MagicMock(data=QuestionSetData({}))

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.put = MagicMock(return_value=None)

    task = StoreResults(database_service, storage_service, questions)
    task.execute(
        StoreResultsInput(
            assessment_id="AID",
            organization="test-organization",
            llm_response=llm_response,
            prompt_uri="s3://bucket/prompts/prowler_0.json",
        )
    )

    storage_service.get.assert_called_once_with(Bucket="bucket", Key=STORE_CHUNK_PATH.format("AID", "prowler_0"))
    database_service.put.assert_not_called()


def test_store_results_with_no_finding_data():
    llm_response = '[{"id":1,"start":10,"end":10}]'
    finding: FindingExtra = FindingExtra(
        id="9",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
        hidden=False,
    )
    database_service = FakeDatabaseService()
    storage_service = FakeStorageService()
    fake_question_set_data = {
        "pillar-1": {
            "id": "pillar-1",
            "label": "Pillar 1",
            "primary_id": "pillar-1",
            "disabled": False,
            "questions": {
                "question-1": {
                    "id": "question-1",
                    "label": "Question 1",
                    "primary_id": "question-1",
                    "none": False,
                    "disabled": False,
                    "best_practices": {
                        "best-practice-1": {
                            "id": "best-practice-1",
                            "primary_id": "best-practice-1",
                            "label": "Best Practice 1",
                            "description": "Best Practice 1 Description",
                            "risk": "High",
                            "status": False,
                            "results": ["1", "2", "3"],
                            "hidden_results": [],
                        }
                    },
                }
            },
        }
    }
    fake_question_set = MagicMock(
        data=QuestionSetData(
            **fake_question_set_data,
        )
    )

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.update = MagicMock(return_value=None)

    invoke_llm_input = StoreResultsInput(
        assessment_id="AID",
        organization="test-organization",
        llm_response=llm_response,
        prompt_uri="s3://bucket/prompts/prowler_0.json",
    )
    task = StoreResults(database_service, storage_service, fake_question_set)
    task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key=STORE_CHUNK_PATH.format("AID", "prowler_0"))
    database_service.update.assert_called_once_with(
        table_name=DDB_TABLE,
        Key={DDB_KEY: "test-organization", DDB_SORT_KEY: ASSESSMENT_SK.format("AID")},
        UpdateExpression="SET findings.#pillar.questions.#question.best_practices.#best_practice.results = list_append(if_not_exists(findings.#pillar.questions.#question.best_practices.#best_practice.results, :empty_list), :new_findings)",
        ExpressionAttributeNames={
            "#pillar": "pillar-1",
            "#question": "question-1",
            "#best_practice": "best-practice-1",
        },
        ExpressionAttributeValues={
            ":new_findings": ["prowler#10"],
            ":empty_list": [],
        },
    )


def test_store_results_with_invalid_llm_response():
    llm_response = "Hello world!"
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
        hidden=False,
    )

    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    questions = MagicMock(data={})

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.put = MagicMock(return_value=None)

    task = StoreResults(database_service, storage_service, questions)
    with pytest.raises(InvalidPromptResponseError):
        task.execute(
            StoreResultsInput(
                assessment_id="AID",
                organization="test-organization",
                llm_response=llm_response,
                prompt_uri="s3://bucket/key/prowler_1.json",
            )
        )
