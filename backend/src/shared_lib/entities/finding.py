from pydantic import BaseModel

FindingID = str


class Finding(BaseModel):
    id: FindingID
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
    hidden: bool = False


class FindingDto(BaseModel):
    hidden: bool | None = None
