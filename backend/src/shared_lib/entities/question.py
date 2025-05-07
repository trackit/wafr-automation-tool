from typing import TypedDict

from pydantic import BaseModel

from entities.best_practice import BestPractice, BestPracticeID, RawBestPractice

QuestionID = str
PillarID = str


class Question(TypedDict):
    id: QuestionID
    primary_id: str
    label: str
    none: bool
    disabled: bool
    best_practices: dict[BestPracticeID, BestPractice]


class Pillar(TypedDict):
    id: PillarID
    primary_id: str
    label: str
    disabled: bool
    questions: dict[QuestionID, Question]


class RawQuestion(TypedDict):
    primary_id: str
    label: str
    best_practices: dict[str, RawBestPractice]


class RawPillar(TypedDict):
    primary_id: str
    label: str
    questions: dict[str, RawQuestion]


class QuestionDto(BaseModel):
    none: bool | None = None
    disabled: bool | None = None


class PillarDto(BaseModel):
    disabled: bool | None = None
