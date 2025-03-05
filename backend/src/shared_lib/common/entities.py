from pydantic import BaseModel


class Finding(BaseModel):
    id: str
    status_code: str | None
    status_detail: str | None


class FindingResource(BaseModel):
    uid: str | None
    name: str | None
    type: str | None
    region: str | None


class FindingRemediation(BaseModel):
    desc: str | None
    references: list[str] | None


class FindingExtra(Finding):
    severity: str | None
    resources: list[FindingResource] | None
    remediation: FindingRemediation | None
    risk_details: str | None


BEST_PRACTICE = list[int]
QUESTION = dict[str, BEST_PRACTICE]
PILLAR = dict[str, QUESTION]


class AssessmentDto(BaseModel):
    name: str | None = None
    role: str | None = None
    step: int | None = None
    question_version: str | None = None
    findings: dict[str, PILLAR] | None = None


class Assessment(BaseModel):
    id: str
    name: str
    role: str
    step: int
    question_version: str
    findings: dict[str, PILLAR] | None
