from typing import TypedDict

from pydantic import BaseModel

FindingID = str


class Finding(BaseModel):
    id: FindingID
    status_detail: str | None = None
    risk_details: str | None = None


class FindingMetaData(BaseModel):
    event_code: str | None = None


class FindingResource(BaseModel):
    uid: str | None = None
    name: str | None = None
    type: str | None = None
    region: str | None = None


class FindingRemediation(BaseModel):
    desc: str | None = None
    references: list[str] | None = None


class FindingExtra(Finding):
    metadata: FindingMetaData | None = None
    status_code: str | None = None
    severity: str | None = None
    resources: list[FindingResource] | None = None
    remediation: FindingRemediation | None = None
    hidden: bool = False


class FindingDto(BaseModel):
    hidden: bool | None = None


class FindingRule(TypedDict):
    pillar: str
    question: str
    best_practice: str


FilteringRules = dict[str, list[FindingRule]]
