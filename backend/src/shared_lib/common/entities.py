from typing import Optional

from pydantic import BaseModel


class Finding(BaseModel):
    id: str
    status_code: Optional[str]
    status_detail: Optional[str]


class FindingResource(BaseModel):
    uid: Optional[str]
    name: Optional[str]
    type: Optional[str]
    region: Optional[str]


class FindingRemediation(BaseModel):
    desc: Optional[str]
    references: Optional[list[str]]


class FindingExtra(Finding):
    severity: Optional[str]
    resources: Optional[list[FindingResource]]
    remediation: Optional[FindingRemediation]
    risk_details: Optional[str]


BEST_PRACTICE = list[int]
QUESTION = dict[str, BEST_PRACTICE]
PILLAR = dict[str, QUESTION]


class Assessment(BaseModel):
    id: str
    name: str
    role: str
    step: int
    question_version: str
    findings: Optional[dict[str, PILLAR]]
