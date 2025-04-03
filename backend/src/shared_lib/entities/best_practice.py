from typing import TypedDict

from pydantic import BaseModel
from utils.api import APIResponseBody

from entities.finding import FindingExtra

BestPracticeID = str


class BestPractice(TypedDict):
    id: BestPracticeID
    label: str
    risk: str
    status: bool
    results: list[str]
    hidden_results: list[str]


class BestPracticeExtra(APIResponseBody):
    id: BestPracticeID
    label: str
    risk: str
    status: bool
    results: list[FindingExtra]
    hidden_results: list[str]


class BestPracticeInfo(BaseModel):
    id: int
    pillar: str
    question: str
    best_practice: str
