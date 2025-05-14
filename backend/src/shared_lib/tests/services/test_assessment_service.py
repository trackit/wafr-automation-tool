from unittest.mock import MagicMock

from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY
from entities.api import APIBestPracticeExtra, APIPagination, APIPaginationOutput
from entities.assessment import Assessment, AssessmentData, AssessmentDto, Steps
from entities.best_practice import BestPractice, BestPracticeDto
from entities.database import UpdateAttrsInput
from entities.finding import FindingExtra
from services.assessment import AssessmentService
from utils.questions import QuestionSetData

from tests.__mocks__.fake_database_service import FakeDatabaseService


def test_assessment_service_retrieve():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: "ASSESSMENT",
            DDB_SORT_KEY: "test-assessment-id",
            "created_by": "test-created-by",
            "name": "test-assessment-name",
            "regions": ["test-region"],
            "role_arn": "test-assessment-role",
            "workflows": ["test-workflow"],
            "step": Steps.FINISHED,
            "created_at": "",
            "question_version": "test-question-version",
            "findings": {
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": {
                                    "id": "best-practice-1",
                                    "primary_id": "best-practice-1",
                                    "label": "Best Practice 1",
                                    "description": "Best Practice 1 Description",
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
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment = assessment_service.retrieve("test-assessment-id", "test-created-by")
    assert assessment == Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        graph_datas=AssessmentData(
            regions={},
            resource_types={},
            severities={},
            findings=0,
        ),
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="Low",
                                    status=False,
                                    results=["1", "2", "3"],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
    )


def test_assessment_service_retrieve_not_found():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(return_value=None)
    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment = assessment_service.retrieve("test-assessment-id", "test-created-by")
    assert assessment is None


def test_assessment_service_retrieve_all():
    fake_database_service = FakeDatabaseService()
    fake_database_service.query = MagicMock(
        return_value={
            "Items": [
                {
                    DDB_KEY: ASSESSMENT_PK,
                    DDB_SORT_KEY: "test-assessment-id",
                    "created_by": "test-created-by",
                    "name": "test-assessment-name",
                    "regions": ["test-region"],
                    "role_arn": "test-assessment-role",
                    "workflows": ["test-workflow"],
                    "step": Steps.FINISHED,
                    "created_at": "",
                    "question_version": "test-question-version",
                    "findings": {
                        "pillar-1": {
                            "id": "pillar-1",
                            "primary_id": "pillar-1",
                            "label": "Pillar 1",
                            "disabled": False,
                            "questions": {
                                "question-1": {
                                    "id": "question-1",
                                    "primary_id": "question-1",
                                    "label": "Question 1",
                                    "none": False,
                                    "disabled": False,
                                    "best_practices": {
                                        "best-practice-1": {
                                            "id": "best-practice-1",
                                            "primary_id": "best-practice-1",
                                            "label": "Best Practice 1",
                                            "description": "Best Practice 1 Description",
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
                }
            ],
            "LastEvaluatedKey": {"test-key": "test-value"},
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)

    pagination = APIPagination(limit=10)
    assessments = assessment_service.retrieve_all(pagination)

    assert assessments == APIPaginationOutput[Assessment](
        items=[
            Assessment(
                id="test-assessment-id",
                created_by="test-created-by",
                name="test-assessment-name",
                regions=["test-region"],
                role_arn="test-assessment-role",
                workflows=["test-workflow"],
                step=Steps.FINISHED,
                created_at="",
                question_version="test-question-version",
                graph_datas=AssessmentData(
                    regions={},
                    resource_types={},
                    severities={},
                    findings=0,
                ),
                findings=QuestionSetData(
                    **{
                        "pillar-1": {
                            "id": "pillar-1",
                            "primary_id": "pillar-1",
                            "label": "Pillar 1",
                            "disabled": False,
                            "questions": {
                                "question-1": {
                                    "id": "question-1",
                                    "primary_id": "question-1",
                                    "label": "Question 1",
                                    "none": False,
                                    "disabled": False,
                                    "best_practices": {
                                        "best-practice-1": BestPractice(
                                            id="best-practice-1",
                                            primary_id="best-practice-1",
                                            label="Best Practice 1",
                                            description="Best Practice 1 Description",
                                            risk="Low",
                                            status=False,
                                            results=["1", "2", "3"],
                                            hidden_results=[],
                                        )
                                    },
                                }
                            },
                        }
                    }
                ),
            )
        ],
        next_token={"test-key": "test-value"},
    )

    fake_database_service.query.assert_called_once_with(
        table_name="test-table",
        KeyConditionExpression=Key(DDB_KEY).eq(ASSESSMENT_PK),
        ScanIndexForward=False,
        Limit=10,
    )


def test_assessment_service_retrieve_all_pagination():
    fake_database_service = FakeDatabaseService()
    fake_database_service.query = MagicMock(
        return_value={
            "Items": [
                {
                    DDB_KEY: ASSESSMENT_PK,
                    DDB_SORT_KEY: "test-assessment-id",
                    "created_by": "test-created-by",
                    "name": "test-assessment-name",
                    "regions": ["test-region"],
                    "role_arn": "test-assessment-role",
                    "workflows": ["test-workflow"],
                    "step": Steps.FINISHED,
                    "created_at": "",
                    "question_version": "test-question-version",
                    "findings": {
                        "pillar-1": {
                            "id": "pillar-1",
                            "primary_id": "pillar-1",
                            "label": "Pillar 1",
                            "disabled": False,
                            "questions": {
                                "question-1": {
                                    "id": "question-1",
                                    "primary_id": "question-1",
                                    "label": "Question 1",
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
                    },
                }
            ],
            "next_token": None,
        }
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    pagination = APIPagination(
        limit=10,
        filter_expression="begins_with(#id, :id)",
        attribute_name={"#id": "id"},
        attribute_value={":id": "test"},
        next_token="eyJ0ZXN0IjoidGVzdCJ9",
    )
    assessments = assessment_service.retrieve_all(pagination)

    fake_database_service.query.assert_called_once_with(
        table_name="test-table",
        KeyConditionExpression=Key(DDB_KEY).eq(ASSESSMENT_PK),
        ScanIndexForward=False,
        Limit=10,
        FilterExpression="begins_with(#id, :id)",
        ExclusiveStartKey={"test": "test"},
        ExpressionAttributeNames={"#id": "id"},
        ExpressionAttributeValues={":id": "test"},
    )
    assert assessments == APIPaginationOutput[Assessment](
        items=[
            Assessment(
                id="test-assessment-id",
                created_by="test-created-by",
                name="test-assessment-name",
                regions=["test-region"],
                role_arn="test-assessment-role",
                workflows=["test-workflow"],
                step=Steps.FINISHED,
                created_at="",
                question_version="test-question-version",
                graph_datas=AssessmentData(
                    regions={},
                    resource_types={},
                    severities={},
                    findings=0,
                ),
                findings=QuestionSetData(
                    **{
                        "pillar-1": {
                            "id": "pillar-1",
                            "primary_id": "pillar-1",
                            "label": "Pillar 1",
                            "disabled": False,
                            "questions": {
                                "question-1": {
                                    "id": "question-1",
                                    "primary_id": "question-1",
                                    "label": "Question 1",
                                    "none": False,
                                    "disabled": False,
                                    "best_practices": {
                                        "best-practice-1": BestPractice(
                                            id="best-practice-1",
                                            primary_id="best-practice-1",
                                            label="Best Practice 1",
                                            description="Best Practice 1 Description",
                                            risk="High",
                                            status=False,
                                            results=["1", "2", "3"],
                                            hidden_results=[],
                                        )
                                    },
                                }
                            },
                        }
                    }
                ),
            )
        ],
        next_token=None,
    )


def test_assessment_service_retrieve_best_practice():
    fake_database_service = FakeDatabaseService()
    fake_database_service.bulk_get = MagicMock(
        return_value=[
            {
                DDB_KEY: "test-assessment-id",
                DDB_SORT_KEY: "prowler:1",
                "status_code": "FAIL",
                "status_detail": "IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
                "severity": "Low",
                "resources": [],
                "remediation": None,
                "hidden": False,
            }
        ]
    )

    assessment_service = AssessmentService(database_service=fake_database_service)

    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="Low",
                                    status=False,
                                    results=["1", "2", "3"],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )

    best_practice = assessment_service.retrieve_api_best_practice(
        assessment, "pillar-1", "question-1", "best-practice-1"
    )

    assert best_practice == APIBestPracticeExtra(
        id="best-practice-1",
        label="Best Practice 1",
        description="Best Practice 1 Description",
        risk="Low",
        status=False,
        results=[
            FindingExtra(
                id="prowler:1",
                status_code="FAIL",
                status_detail="IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
                severity="Low",
                resources=[],
                remediation=None,
                hidden=False,
            )
        ],
        hidden_results=[],
    )

    fake_database_service.bulk_get.assert_called_once_with(
        table_name="test-table",
        keys=[
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "1"},
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "2"},
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "3"},
        ],
    )


def test_assessment_service_retrieve_best_practice_with_no_findings():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData({}),
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_api_best_practice(assessment, "pillar-1", "question-1", "best-practice-1")
    assert finding is None


def test_assessment_service_retrieve_best_practice_not_found_pillar():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {},
                }
            }
        ),
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_api_best_practice(assessment, "pillar-2", "question-1", "best-practice-1")
    assert finding is None


def test_assessment_service_retrieve_best_practice_not_found_question():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {},
                        }
                    },
                }
            }
        ),
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_api_best_practice(assessment, "pillar-1", "question-2", "best-practice-1")
    assert finding is None


def test_assessment_service_retrieve_best_practice_not_found_best_practice():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="High",
                                    status=False,
                                    results=["1", "2", "3"],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_api_best_practice(assessment, "pillar-1", "question-1", "best-practice-2")
    assert finding is None


def test_assessment_service_retrieve_best_practice_with_no_results():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="Low",
                                    status=False,
                                    results=[],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_api_best_practice(assessment, "pillar-1", "question-1", "best-practice-1")
    assert finding == APIBestPracticeExtra(
        id="best-practice-1",
        label="Best Practice 1",
        description="Best Practice 1 Description",
        risk="Low",
        status=False,
        results=[],
        hidden_results=[],
    )


def test_assessment_service_retrieve_finding():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: "test-assessment-id",
            DDB_SORT_KEY: "prowler:1",
            "created_by": "test-created-by",
            "status_code": "FAIL",
            "status_detail": "IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
            "severity": "Low",
            "resources": [],
            "remediation": None,
            "hidden": False,
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_finding("test-assessment-id", "test-created-by", "prowler:1")

    assert finding == FindingExtra(
        id="prowler:1",
        status_code="FAIL",
        status_detail="IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
        severity="Low",
        resources=[],
        remediation=None,
        hidden=False,
    )

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "prowler:1"},
    )


def test_assessment_service_retrieve_finding_not_found():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(return_value=None)
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_finding("test-assessment-id", "test-created-by", "prowler:1")
    assert finding is None


def test_assessment_service_retrieve_findings():
    fake_database_service = FakeDatabaseService()
    fake_database_service.bulk_get = MagicMock(
        return_value=[
            {
                DDB_KEY: "test-assessment-id",
                DDB_SORT_KEY: "prowler:1",
                "status_code": "FAIL",
                "status_detail": "IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
                "severity": "Low",
                "resources": [],
                "remediation": None,
                "hidden": False,
            }
        ]
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    findings = assessment_service.retrieve_findings("test-assessment-id", ["prowler:1", "prowler:2", "prowler:3"])

    assert findings == [
        FindingExtra(
            id="prowler:1",
            status_code="FAIL",
            status_detail="IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
            severity="Low",
            resources=[],
            remediation=None,
            hidden=False,
        )
    ]

    fake_database_service.bulk_get.assert_called_once_with(
        table_name="test-table",
        keys=[
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "prowler:1"},
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "prowler:2"},
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "prowler:3"},
        ],
    )


def test_assessment_service_update():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: "ASSESSMENT",
            DDB_SORT_KEY: "test-assessment-id",
            "created_by": "test-created-by",
            "name": "test-assessment-name",
            "regions": ["test-region"],
            "role_arn": "test-assessment-role",
            "workflows": ["test-workflow"],
            "step": Steps.FINISHED,
            "created_at": "",
            "question_version": "test-question-version",
            "findings": {},
            "graph_datas": AssessmentData(
                regions={},
                resource_types={},
                severities={},
                findings=0,
            ),
        }
    )

    fake_database_service.update_attrs = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment_dto = AssessmentDto(name="test-assessment-name", role_arn="test-assessment-role")
    assessment_service.update_assessment("test-assessment-id", assessment_dto)

    fake_database_service.update_attrs.assert_called_once_with(
        table_name="test-table",
        event=UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
            attrs={
                "name": "test-assessment-name",
                "role_arn": "test-assessment-role",
            },
        ),
    )


def test_assessment_service_update_best_practice():
    fake_database_service = FakeDatabaseService()
    fake_database_service.update_attrs = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="High",
                                    status=False,
                                    results=["1", "2", "3"],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )
    best_practice_dto = BestPracticeDto(status=True)

    assessment_service.update_best_practice(
        assessment, "pillar-1", "question-1", "best-practice-1", best_practice_dto=best_practice_dto
    )

    fake_database_service.update_attrs.assert_called_once_with(
        table_name="test-table",
        event=UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
            update_expression_path="findings.#pillar.questions.#question.best_practices.#best_practice.",
            expression_attribute_names={
                "#pillar": "pillar-1",
                "#question": "question-1",
                "#best_practice": "best-practice-1",
            },
            attrs={"status": True},
        ),
    )


def test_assessment_service_delete_findings():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        created_by="test-created-by",
        name="test-assessment-name",
        regions=["test-region"],
        role_arn="test-assessment-role",
        workflows=["test-workflow"],
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings=QuestionSetData(
            **{
                "pillar-1": {
                    "id": "pillar-1",
                    "primary_id": "pillar-1",
                    "label": "Pillar 1",
                    "disabled": False,
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "primary_id": "question-1",
                            "label": "Question 1",
                            "none": False,
                            "disabled": False,
                            "best_practices": {
                                "best-practice-1": BestPractice(
                                    id="best-practice-1",
                                    primary_id="best-practice-1",
                                    label="Best Practice 1",
                                    description="Best Practice 1 Description",
                                    risk="High",
                                    status=False,
                                    results=["prowler:1"],
                                    hidden_results=[],
                                )
                            },
                        }
                    },
                }
            }
        ),
    )
    fake_database_service.bulk_delete = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)

    assert not assessment_service.delete_findings(assessment)

    fake_database_service.bulk_delete.assert_called_once_with(
        table_name="test-table", keys=[{"PK": "test-assessment-id", "SK": "prowler:1"}]
    )


def test_assessment_service_delete():
    fake_database_service = FakeDatabaseService()
    fake_database_service.delete = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment_service.delete("test-assessment-id")

    fake_database_service.delete.assert_called_once_with(
        table_name="test-table",
        key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
    )
