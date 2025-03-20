from enum import StrEnum
from typing import Any, TypedDict

from pydantic import BaseModel
from types_boto3_dynamodb.type_defs import (
    ConditionBaseImportTypeDef,
    TableAttributeValueTypeDef,
)
from utils.api import APIResponseBody


class CloudSploitFinding(BaseModel):
    plugin: str
    category: str
    title: str
    description: str
    resource: str
    region: str
    status: str
    message: str


class Finding(BaseModel):
    id: str
    status_code: str | None = None
    status_detail: str | None = None


class FindingResource(BaseModel):
    uid: str | None = None
    name: str | None = None
    type: str | None = None
    region: str | None = None


class FindingRemediation(BaseModel):
    desc: str | None = None
    references: list[str] | None = None


class FindingExtra(Finding):
    severity: str | None = None
    resources: list[FindingResource] | None = None
    remediation: FindingRemediation | None = None
    risk_details: str | None = None


class AnswerData(BaseModel):
    pillar: str
    question: str
    best_practice: str


class BestPractice(TypedDict):
    risk: str
    status: bool
    results: list[str]


class BestPracticeExtra(APIResponseBody):
    risk: str
    status: bool
    results: list[FindingExtra]


QuestionDict = dict[str, BestPractice]
PillarDict = dict[str, QuestionDict]


class BestPracticeInfo(BaseModel):
    id: int
    pillar: str
    question: str
    best_practice: str


class AIFindingAssociation(TypedDict):
    id: int
    start: int
    end: int


class AssessmentDto(BaseModel):
    name: str | None = None
    role_arn: str | None = None
    created_at: str | None = None
    step: str | None = None
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, PillarDict] | None = None


class Assessment(BaseModel):
    id: str
    name: str
    role_arn: str
    created_at: str
    step: str
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, PillarDict] | None = None


class Pagination(BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    limit: int
    next_token: str | None = None
    filter: ConditionBaseImportTypeDef | None = None
    attribute_name: dict[str, str] | None = None
    attribute_value: dict[str, Any] | None = None


class PaginationOutput[T](BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    items: list[T]
    next_token: dict[str, TableAttributeValueTypeDef] | None


Prompt = str
PromptS3Uri = str
ChunkId = str


class ScanningTool(StrEnum):
    PROWLER = "prowler"
    CLOUD_CUSTODIAN = "cloud-custodian"
    CLOUDSPLOIT = "cloudsploit"


class CloudCustodianPolicy(StrEnum):
    EC2_STOPPED_INSTANCE = "ec2-stopped-instance"


class AIModel(StrEnum):
    Claude3Dot5Sonnet = "claude-3-5-sonnet"
    Claude3Dot7Sonnet = "claude-3-7-sonnet"
    DeepseekR1 = "deepseek-r1"
    NovaPro = "nova-pro"
    NovaLite = "nova-lite"
    NovaMicro = "nova-micro"
