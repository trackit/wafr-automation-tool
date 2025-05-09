from pydantic import BaseModel

BestPracticeID = str


class BestPractice(BaseModel):
    id: BestPracticeID
    primary_id: str = ""
    label: str
    description: str
    risk: str
    status: bool
    results: list[str]
    hidden_results: list[str]


class BestPracticeInfo(BaseModel):
    id: int
    pillar: str
    question: str
    best_practice: dict[str, str]


class BestPracticeDto(BaseModel):
    status: bool | None = None


class RawBestPractice(BaseModel):
    primary_id: str
    label: str
    description: str
    risk: str
