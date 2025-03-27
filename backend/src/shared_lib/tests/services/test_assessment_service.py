from unittest.mock import MagicMock

from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY
from common.entities import Assessment, AssessmentDto, BestPracticeExtra, FindingExtra, Pagination, PaginationOutput
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
                    "id": "pillar-1",
                    "label": "Pillar 1",
                    "questions": {
                        "question-1": {
                            "id": "question-1",
                            "label": "Question 1",
                            "best_practices": {
                                "best-practice-1": {
                                    "id": "best-practice-1",
                                    "label": "Best Practice 1",
                                    "risk": "Low",
                                    "status": False,
                                    "results": ["1", "2", "3"],
                                }
                            },
                        }
                    },
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
                "id": "pillar-1",
                "label": "Pillar 1",
                "questions": {
                    "question-1": {
                        "id": "question-1",
                        "label": "Question 1",
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
                            }
                        },
                    }
                },
            }
        },
    )

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
    )


def test_assessment_service_retrieve_not_found():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(return_value=None)
    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment = assessment_service.retrieve("test-assessment-id")
    assert assessment is None


def test_assessment_service_retrieve_all():
    fake_database_service = FakeDatabaseService()
    fake_database_service.query = MagicMock(
        return_value={
            "Items": [
                {
                    DDB_KEY: ASSESSMENT_PK,
                    DDB_SORT_KEY: "test-assessment-id",
                    "name": "test-assessment-name",
                    "role_arn": "test-assessment-role",
                    "step": Steps.FINISHED,
                    "created_at": "",
                    "question_version": "test-question-version",
                    "findings": {
                        "pillar-1": {
                            "id": "pillar-1",
                            "label": "Pillar 1",
                            "questions": {
                                "question-1": {
                                    "id": "question-1",
                                    "label": "Question 1",
                                    "best_practices": {
                                        "best-practice-1": {
                                            "id": "best-practice-1",
                                            "label": "Best Practice 1",
                                            "risk": "Low",
                                            "status": False,
                                            "results": ["1", "2", "3"],
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

    pagination = Pagination(limit=10)
    assessments = assessment_service.retrieve_all(pagination)

    assert assessments == PaginationOutput[Assessment](
        items=[
            Assessment(
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
                                "best_practices": {
                                    "best-practice-1": {
                                        "id": "best-practice-1",
                                        "label": "Best Practice 1",
                                        "risk": "Low",
                                        "status": False,
                                        "results": ["1", "2", "3"],
                                    }
                                },
                            }
                        },
                    }
                },
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
                    "name": "test-assessment-name",
                    "role_arn": "test-assessment-role",
                    "step": Steps.FINISHED,
                    "created_at": "",
                    "question_version": "test-question-version",
                    "findings": {
                        "pillar-1": {
                            "id": "pillar-1",
                            "label": "Pillar 1",
                            "questions": {
                                "question-1": {
                                    "id": "question-1",
                                    "label": "Question 1",
                                    "best_practices": {
                                        "best-practice-1": {
                                            "id": "best-practice-1",
                                            "label": "Best Practice 1",
                                            "risk": "Low",
                                            "status": False,
                                            "results": ["1", "2", "3"],
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
    pagination = Pagination(
        limit=10,
        filter="begins_with(#id, :id)",
        attribute_name={"#id": "id"},
        attribute_value={":id": "test"},
        next_token="eyJ0ZXN0IjoidGVzdCJ9",  # noqa: S106
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
    assert assessments == PaginationOutput[Assessment](
        items=[
            Assessment(
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
                                "best_practices": {
                                    "best-practice-1": {
                                        "id": "best-practice-1",
                                        "label": "Best Practice 1",
                                        "risk": "Low",
                                        "status": False,
                                        "results": ["1", "2", "3"],
                                    }
                                },
                            }
                        },
                    }
                },
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
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
                            }
                        },
                    }
                },
            }
        },
    )

    best_practice = assessment_service.retrieve_best_practice(assessment, "pillar-1", "question-1", "best-practice-1")

    assert best_practice == BestPracticeExtra(
        id="best-practice-1",
        label="Best Practice 1",
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
        risk="Low",
        status=False,
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
        name="test-assessment-name",
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={},
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_best_practice(assessment, "pillar-1", "question-1", "best-practice-1")
    assert finding is None


def test_assessment_service_retrieve_best_practice_not_found_pillar():
    fake_database_service = FakeDatabaseService()
    assessment = Assessment(
        id="test-assessment-id",
        name="test-assessment-name",
        role_arn="test-assessment-role",
        step=Steps.FINISHED,
        created_at="",
        question_version="test-question-version",
        findings={"pillar-1": {"id": "pillar-1", "label": "Pillar 1", "questions": {}}},
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_best_practice(assessment, "pillar-2", "question-1", "best-practice-1")
    assert finding is None


def test_assessment_service_retrieve_best_practice_not_found_question():
    fake_database_service = FakeDatabaseService()
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
                        "best_practices": {},
                    }
                },
            }
        },
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_best_practice(assessment, "pillar-1", "question-2", "best-practice-1")
    assert finding is None


def test_assessment_service_retrieve_best_practice_not_found_best_practice():
    fake_database_service = FakeDatabaseService()
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
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
                            }
                        },
                    }
                },
            }
        },
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_best_practice(assessment, "pillar-1", "question-1", "best-practice-2")
    assert finding is None


def test_assessment_service_retrieve_best_practice_with_no_results():
    fake_database_service = FakeDatabaseService()
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
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": [],
                            }
                        },
                    }
                },
            }
        },
    )
    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_best_practice(assessment, "pillar-1", "question-1", "best-practice-1")
    assert finding == BestPracticeExtra(
        id="best-practice-1",
        label="Best Practice 1",
        results=[],
        risk="Low",
        status=False,
    )


def test_assessment_service_retrieve_finding():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: "test-assessment-id",
            DDB_SORT_KEY: "prowler:1",
            "status_code": "FAIL",
            "status_detail": "IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
            "severity": "Low",
            "resources": [],
            "remediation": None,
            "hidden": False,
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_finding("test-assessment-id", "prowler:1")

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
    finding = assessment_service.retrieve_finding("test-assessment-id", "prowler:1")
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
    fake_database_service.update_attrs = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment_dto = AssessmentDto(name="test-assessment-name", role_arn="test-assessment-role")
    assessment_service.update("test-assessment-id", assessment_dto)

    fake_database_service.update_attrs.assert_called_once_with(
        table_name="test-table",
        key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
        attrs={
            "name": "test-assessment-name",
            "role_arn": "test-assessment-role",
        },
    )


def test_assessment_service_update_best_practice():
    fake_database_service = FakeDatabaseService()
    fake_database_service.update = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)
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
                        "best_practices": {
                            "best-practice-1": {
                                "id": "best-practice-1",
                                "label": "Best Practice 1",
                                "risk": "Low",
                                "status": False,
                                "results": ["1", "2", "3"],
                            }
                        },
                    }
                },
            }
        },
    )

    assessment_service.update_best_practice(assessment, "pillar-1", "question-1", "best-practice-1", status=True)

    fake_database_service.update.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
        UpdateExpression="SET findings.#pillar.questions.#question.best_practices.#best_practice.#status = :status",
        ExpressionAttributeNames={
            "#pillar": "pillar-1",
            "#question": "question-1",
            "#best_practice": "best-practice-1",
            "#status": "status",
        },
        ExpressionAttributeValues={
            ":status": True,
        },
    )


def test_assessment_service_delete_findings():
    fake_database_service = FakeDatabaseService()
    fake_database_service.query_all = MagicMock(
        return_value=[
            {
                DDB_KEY: ASSESSMENT_PK,
                DDB_SORT_KEY: "prowler:1",
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
        ],
    )
    fake_database_service.bulk_delete = MagicMock()

    assessment_service = AssessmentService(database_service=fake_database_service)

    assert not assessment_service.delete_findings("test-assessment-id")

    fake_database_service.query_all.assert_called_once_with(
        table_name="test-table",
        KeyConditionExpression=Key(DDB_KEY).eq("test-assessment-id"),
    )

    fake_database_service.bulk_delete.assert_called_once_with(
        table_name="test-table", keys=[{"PK": "ASSESSMENT", "SK": "prowler:1"}]
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
