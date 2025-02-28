from typing import Optional

from pydantic import BaseModel


class ChunkFormat(BaseModel):
    id: int
    status_code: Optional[str]
    status_detail: Optional[str]


class ChunkFormatResource(BaseModel):
    uid: Optional[str]
    name: Optional[str]
    type: Optional[str]
    region: Optional[str]


class ChunkFormatRemediation(BaseModel):
    desc: Optional[str]
    references: Optional[list[str]]


class ChunkFormatForRetrieve(ChunkFormat):
    severity: Optional[str]
    resources: Optional[list[ChunkFormatResource]]
    remediation: Optional[ChunkFormatRemediation]
    risk_details: Optional[str]
