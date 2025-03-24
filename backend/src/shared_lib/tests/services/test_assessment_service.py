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
        Limit=10,
    )


def test_assessment_service_retrieve_best_practice():
    fake_database_service = FakeDatabaseService()
    fake_database_service.bulk_get = MagicMock(
        return_value=[
            {
                DDB_KEY: "ASSESSMENT",
                DDB_SORT_KEY: "prowler:1",
                "name": "test-assessment-name",
                "role_arn": "test-assessment-role",
                "step": Steps.FINISHED,
                "created_at": "",
                "question_version": "test-question-version",
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
                                    }
                                },
                            }
                        },
                    }
                },
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
                status_code=None,
                status_detail=None,
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


def test_assessment_service_retrieve_finding():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: ASSESSMENT_PK,
            DDB_SORT_KEY: "prowler:1",
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
    finding = assessment_service.retrieve_finding("test-assessment-id", "prowler:1")

    assert finding == FindingExtra(
        id="prowler:1",
        status_code=None,
        status_detail=None,
    )

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "prowler:1"},
    )


def test_assessment_service_retrieve_findings():
    fake_database_service = FakeDatabaseService()
    fake_database_service.bulk_get = MagicMock(
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
                                    }
                                },
                            }
                        },
                    }
                },
            }
        ]
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    findings = assessment_service.retrieve_findings("test-assessment-id", ["prowler:1", "prowler:2", "prowler:3"])

    assert findings == [
        FindingExtra(
            id="prowler:1",
            status_code=None,
            status_detail=None,
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

    assessment_service.delete_findings("test-assessment-id")

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
