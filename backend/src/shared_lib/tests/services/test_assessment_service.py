from decimal import Decimal
from unittest.mock import MagicMock, call

import pytest
from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY
from common.entities import Assessment, AssessmentDto, FindingExtra, FindingRemediation, FindingResource
from exceptions.assessment import FindingNotFoundError
from services.assessment import AssessmentService

from tests.__mocks__.fake_database_service import FakeDatabaseService


def test_assessment_service_retrieve():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            DDB_KEY: "ASSESSMENT",
            DDB_SORT_KEY: "test-assessment-id",
            "name": "test-assessment-name",
            "role": "test-assessment-role",
            "step": Decimal("1"),
            "question_version": "test-question-version",
            "findings": {"pillar-1": {"question-1": {"best-practice-1": [Decimal("1"), Decimal("2"), Decimal("3")]}}},
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment = assessment_service.retrieve("test-assessment-id")
    assert assessment == {
        "id": "test-assessment-id",
        "name": "test-assessment-name",
        "role": "test-assessment-role",
        "step": 1,
        "question_version": "test-question-version",
        "findings": {"pillar-1": {"question-1": {"best-practice-1": [1, 2, 3]}}},
    }

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
    )


def test_assessment_service_retrieve_best_practice():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        side_effect=[
            {
                "PK": "test-assessment-id",
                "SK": "1",
                "id": "test-finding-id",
                "remediation": {
                    "desc": "test-desc",
                    "references": [
                        "test-references",
                    ],
                },
                "resources": [
                    {
                        "name": "test-name",
                        "region": "us-east-1",
                        "type": "Other",
                        "uid": "arn:aws:s3:::test-bucket",
                    }
                ],
                "risk_details": "test-risk-details",
                "severity": "Low",
                "status_code": "FAIL",
                "status_detail": "test-status-detail",
            },
            {
                "PK": "test-assessment-id",
                "SK": "2",
                "id": "test-finding-id-2",
                "remediation": {
                    "desc": "test-desc-2",
                    "references": [
                        "test-references-2",
                    ],
                },
                "resources": [
                    {
                        "name": "test-name",
                        "region": "us-east-1",
                        "type": "Other",
                        "uid": "arn:aws:s3:::test-bucket",
                    }
                ],
                "risk_details": "test-risk-details",
                "severity": "Low",
                "status_code": "FAIL",
                "status_detail": "test-status-detail-2",
            },
        ],
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    findings = assessment_service.retrieve_best_practice(
        assessment=Assessment(
            id="test-assessment-id",
            name="test-assessment-name",
            role="test-assessment-role",
            step=1,
            question_version="test-question-version",
            findings={
                "pillar-1": {
                    "question-1": {
                        "best-practice-1": [1, 2],
                    }
                },
            },
        ),
        best_practice_name="best-practice-1",
    )
    assert findings == [
        FindingExtra(
            id="1",
            remediation=FindingRemediation(
                desc="test-desc",
                references=[
                    "test-references",
                ],
            ),
            resources=[
                FindingResource(
                    name="test-name",
                    region="us-east-1",
                    type="Other",
                    uid="arn:aws:s3:::test-bucket",
                )
            ],
            risk_details="test-risk-details",
            severity="Low",
            status_code="FAIL",
            status_detail="test-status-detail",
        ),
        FindingExtra(
            id="2",
            remediation=FindingRemediation(
                desc="test-desc-2",
                references=[
                    "test-references-2",
                ],
            ),
            resources=[
                FindingResource(
                    name="test-name",
                    region="us-east-1",
                    type="Other",
                    uid="arn:aws:s3:::test-bucket",
                )
            ],
            risk_details="test-risk-details",
            severity="Low",
            status_code="FAIL",
            status_detail="test-status-detail-2",
        ),
    ]

    fake_database_service.get.assert_has_calls(
        [
            call(table_name="test-table", Key={"PK": "test-assessment-id", "SK": "1"}),
            call(table_name="test-table", Key={"PK": "test-assessment-id", "SK": "2"}),
        ]
    )


def test_assessment_service_retrieve_inexistent_best_practice():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        side_effect=[
            {
                "PK": "test-assessment-id",
                "SK": "1",
                "id": "test-finding-id",
                "remediation": {
                    "desc": "test-desc",
                    "references": [
                        "test-references",
                    ],
                },
                "resources": [
                    {
                        "name": "test-name",
                        "region": "us-east-1",
                        "type": "Other",
                        "uid": "arn:aws:s3:::test-bucket",
                    }
                ],
                "risk_details": "test-risk-details",
            },
            {
                "PK": "test-assessment-id",
                "SK": "2",
                "id": "test-finding-id-2",
                "remediation": {
                    "desc": "test-desc-2",
                    "references": [
                        "test-references-2",
                    ],
                },
                "resources": [
                    {
                        "name": "test-name",
                        "region": "us-east-1",
                        "type": "Other",
                        "uid": "arn:aws:s3:::test-bucket",
                    }
                ],
                "risk_details": "test-risk-details",
            },
            None,
        ],
    )

    assessment_service = AssessmentService(database_service=fake_database_service)

    with pytest.raises(FindingNotFoundError):
        assessment_service.retrieve_best_practice(
            assessment=Assessment(
                id="test-assessment-id",
                name="test-assessment-name",
                role="test-assessment-role",
                step=1,
                question_version="test-question-version",
                findings={
                    "pillar-1": {
                        "question-1": {
                            "best-practice-1": [1, 2, 3],
                        }
                    },
                },
            ),
            best_practice_name="best-practice-1",
        )

    fake_database_service.get.assert_has_calls(
        [
            call(table_name="test-table", Key={"PK": "test-assessment-id", "SK": "1"}),
            call(table_name="test-table", Key={"PK": "test-assessment-id", "SK": "2"}),
            call(table_name="test-table", Key={"PK": "test-assessment-id", "SK": "3"}),
        ]
    )


def test_assessment_service_retrieve_finding():
    fake_database_service = FakeDatabaseService()
    fake_database_service.get = MagicMock(
        return_value={
            "PK": "test-assessment-id",
            "SK": "1",
            "id": "test-finding-id",
            "remediation": {
                "desc": "Enable IAM Access Analyzer for all accounts, create analyzer and take action over it is recommendations (IAM Access Analyzer is available at no additional cost).",
                "references": [
                    "aws accessanalyzer create-analyzer --analyzer-name <NAME> --type <ACCOUNT|ORGANIZATION>",
                    "https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html",
                ],
            },
            "resources": [
                {
                    "name": "analyzer/unknown",
                    "region": "ap-northeast-1",
                    "type": "Other",
                    "uid": "arn:aws:accessanalyzer:ap-northeast-1:XXXXXXXXXXXX:analyzer/unknown",
                }
            ],
            "risk_details": "AWS IAM Access Analyzer helps you identify the resources in your organization and accounts, such as Amazon S3 buckets or IAM roles, that are shared with an external entity. This lets you identify unintended access to your resources and data, which is a security risk. IAM Access Analyzer uses a form of mathematical analysis called automated reasoning, which applies logic and mathematical inference to determine all possible access paths allowed by a resource policy.",
            "severity": "Low",
            "status_code": "FAIL",
            "status_detail": "IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
        }
    )

    assessment_service = AssessmentService(database_service=fake_database_service)
    finding = assessment_service.retrieve_finding("test-assessment-id", "test-finding-id")
    assert finding == FindingExtra(
        id="1",
        remediation=FindingRemediation(
            desc="Enable IAM Access Analyzer for all accounts, create analyzer and take action over it is recommendations (IAM Access Analyzer is available at no additional cost).",
            references=[
                "aws accessanalyzer create-analyzer --analyzer-name <NAME> --type <ACCOUNT|ORGANIZATION>",
                "https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html",
            ],
        ),
        resources=[
            FindingResource(
                name="analyzer/unknown",
                region="ap-northeast-1",
                type="Other",
                uid="arn:aws:accessanalyzer:ap-northeast-1:XXXXXXXXXXXX:analyzer/unknown",
            )
        ],
        risk_details="AWS IAM Access Analyzer helps you identify the resources in your organization and accounts, such as Amazon S3 buckets or IAM roles, that are shared with an external entity. This lets you identify unintended access to your resources and data, which is a security risk. IAM Access Analyzer uses a form of mathematical analysis called automated reasoning, which applies logic and mathematical inference to determine all possible access paths allowed by a resource policy.",
        severity="Low",
        status_detail="IAM Access Analyzer in account XXXXXXXXXXXX is not enabled.",
        status_code="FAIL",
    )

    fake_database_service.get.assert_called_once_with(
        table_name="test-table",
        Key={"PK": "test-assessment-id", "SK": "test-finding-id"},
    )


def test_assessment_service_update():
    fake_database_service = FakeDatabaseService()
    fake_database_service.update_attrs = MagicMock(return_value=None)

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment_service.update(
        assessment_id="test-assessment-id",
        assessment_dto=AssessmentDto(
            name="test-assessment-name",
            role="test-assessment-role",
            step=1,
            question_version="test-question-version",
            findings={
                "pillar-1": {
                    "question-1": {
                        "best-practice-1": [1, 2, 3],
                    }
                }
            },
        ),
    )

    fake_database_service.update_attrs.assert_called_once_with(
        table_name="test-table",
        key={DDB_KEY: "ASSESSMENT", DDB_SORT_KEY: "test-assessment-id"},
        attrs={
            "name": "test-assessment-name",
            "role": "test-assessment-role",
            "step": 1,
            "question_version": "test-question-version",
            "findings": {"pillar-1": {"question-1": {"best-practice-1": [1, 2, 3]}}},
        },
    )


def test_assessment_service_delete_findings():
    fake_database_service = FakeDatabaseService()
    fake_database_service.query = MagicMock(
        return_value=[
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "1"},
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "2"},
        ]
    )
    fake_database_service.bulk_delete = MagicMock(return_value=None)

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment_service.delete_findings("test-assessment-id")

    fake_database_service.query.assert_called_once_with(
        table_name="test-table",
        KeyConditionExpression=Key(DDB_KEY).eq("test-assessment-id"),
    )
    fake_database_service.bulk_delete.assert_called_once_with(
        table_name="test-table",
        keys=[
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "1"},
            {DDB_KEY: "test-assessment-id", DDB_SORT_KEY: "2"},
        ],
    )


def test_assessment_service_delete():
    fake_database_service = FakeDatabaseService()
    fake_database_service.delete = MagicMock(return_value=None)

    assessment_service = AssessmentService(database_service=fake_database_service)
    assessment_service.delete("test-assessment-id")

    fake_database_service.delete.assert_called_once_with(
        table_name="test-table",
        key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: "test-assessment-id"},
    )
