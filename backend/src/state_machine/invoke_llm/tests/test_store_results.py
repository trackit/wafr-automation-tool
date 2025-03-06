import json
from unittest.mock import MagicMock

from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE
from common.entities import FindingExtra
from tests.__mocks__.fake_database_service import FakeDatabaseService
from tests.__mocks__.fake_storage_service import FakeStorageService

from state_machine.event import StoreResultsInput

from ..app.tasks.store_results import StoreResults


def test_store_results():
    llm_response = '{"content":[{"text":"{\\"Operational excellence\\":{\\"How do you determine what your priorities are?\\":{\\"Evaluate external customer needs\\":[10]}}}"}]}'
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
    )
    database_service = FakeDatabaseService()
    storage_service = FakeStorageService()
    questions = MagicMock(
        questions={
            "Operational excellence": {
                "How do you determine what your priorities are?": {"Evaluate external customer needs": []}
            }
        }
    )

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.update = MagicMock(return_value=None)
    database_service.put = MagicMock(return_value=None)

    invoke_llm_input = StoreResultsInput(
        assessment_id="AID", llm_response=llm_response, prompt_uri="s3://bucket/key-1.json"
    )
    task = StoreResults(database_service, storage_service, questions)
    result = task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key="AID/chunks/chunk-1.json")
    database_service.update.assert_called_once_with(
        table_name=DDB_TABLE,
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: invoke_llm_input.assessment_id},
        UpdateExpression="SET findings.#pillar.#question.#bp = list_append(if_not_exists(findings.#pillar.#question.#bp, :empty_list), :new_findings)",
        ExpressionAttributeNames={
            "#pillar": "Operational excellence",
            "#question": "How do you determine what your priorities are?",
            "#bp": "Evaluate external customer needs",
        },
        ExpressionAttributeValues={
            ":new_findings": ["10"],
            ":empty_list": [],
        },
    )
    database_service.put.assert_called_once_with(
        table_name=DDB_TABLE,
        item={
            **finding.model_dump(exclude={"id"}),
            DDB_KEY: invoke_llm_input.assessment_id,
            DDB_SORT_KEY: finding.id,
        },
    )
    assert not result


def test_store_results_with_no_finding():
    llm_response = '{"content":[{"text":"{\\"Operational excellence\\":{\\"How do you determine what your priorities are?\\":{\\"Evaluate external customer needs\\":[]}}}"}]}'
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
    )
    database_service = FakeDatabaseService()
    storage_service = FakeStorageService()
    questions = MagicMock(
        questions={
            "Operational excellence": {
                "How do you determine what your priorities are?": {"Evaluate external customer needs": []}
            }
        }
    )

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))

    invoke_llm_input = StoreResultsInput(
        assessment_id="AID", llm_response=llm_response, prompt_uri="s3://bucket/key-1.json"
    )
    task = StoreResults(database_service, storage_service, questions)
    result = task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key="AID/chunks/chunk-1.json")
    assert not result


def test_store_results_with_invalid_questions():
    llm_response = '{"content":[{"text":"{\\"Operational excellence\\":{\\"How do you determine what your priorities are?\\":{\\"INVALID\\":[10]}}}"}]}'
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
    )

    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    questions = MagicMock(questions={})

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.put = MagicMock(return_value=None)

    task = StoreResults(database_service, storage_service, questions)
    result = task.execute(
        StoreResultsInput(assessment_id="AID", llm_response=llm_response, prompt_uri="s3://bucket/key-1.json")
    )
    assert not result


def test_store_results_with_no_finding_data():
    llm_response = '{"content":[{"text":"{\\"Operational excellence\\":{\\"How do you determine what your priorities are?\\":{\\"Evaluate external customer needs\\":[10]}}}"}]}'
    finding: FindingExtra = FindingExtra(
        id="9",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
    )
    database_service = FakeDatabaseService()
    storage_service = FakeStorageService()
    questions = MagicMock(
        questions={
            "Operational excellence": {
                "How do you determine what your priorities are?": {"Evaluate external customer needs": []}
            }
        }
    )

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.update = MagicMock(return_value=None)

    invoke_llm_input = StoreResultsInput(
        assessment_id="AID", llm_response=llm_response, prompt_uri="s3://bucket/key-1.json"
    )
    task = StoreResults(database_service, storage_service, questions)
    result = task.execute(invoke_llm_input)

    storage_service.get.assert_called_once_with(Bucket="bucket", Key="AID/chunks/chunk-1.json")
    database_service.update.assert_called_once_with(
        table_name=DDB_TABLE,
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: invoke_llm_input.assessment_id},
        UpdateExpression="SET findings.#pillar.#question.#bp = list_append(if_not_exists(findings.#pillar.#question.#bp, :empty_list), :new_findings)",
        ExpressionAttributeNames={
            "#pillar": "Operational excellence",
            "#question": "How do you determine what your priorities are?",
            "#bp": "Evaluate external customer needs",
        },
        ExpressionAttributeValues={
            ":new_findings": ["10"],
            ":empty_list": [],
        },
    )
    assert not result


def test_store_results_with_invalid_llm_response():
    llm_response = '{"content":[{"text":"HELLO WORLD"}]}'
    finding: FindingExtra = FindingExtra(
        id="10",
        status_code="200",
        status_detail="OK",
        severity="High",
        resources=None,
        remediation=None,
        risk_details="Risk details",
    )

    storage_service = FakeStorageService()
    database_service = FakeDatabaseService()
    questions = MagicMock(questions={})

    storage_service.get = MagicMock(return_value=json.dumps([finding.model_dump()]))
    database_service.put = MagicMock(return_value=None)

    task = StoreResults(database_service, storage_service, questions)
    result = task.execute(
        StoreResultsInput(assessment_id="AID", llm_response=llm_response, prompt_uri="s3://bucket/key-1.json")
    )
    assert not result
