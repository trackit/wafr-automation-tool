from enum import StrEnum
from typing import Any

from pydantic import BaseModel


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


BestPracticeDict = list[int]
QuestionDict = dict[str, BestPracticeDict]
PillarDict = dict[str, QuestionDict]


class AssessmentDto(BaseModel):
    name: str | None = None
    role: str | None = None
    step: int | None = None
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: dict[str, PillarDict] | None = None


class Assessment(BaseModel):
    id: str
    name: str
    role: str
    step: int
    error: dict[str, Any] | None = None
    question_version: str
    findings: dict[str, PillarDict] | None = None


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
