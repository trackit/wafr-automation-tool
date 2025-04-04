from typing import TypedDict

from pydantic import BaseModel

from entities.best_practice import BestPractice, BestPracticeID

QuestionID = str
PillarID = str

Question = dict[BestPracticeID, BestPractice]
Pillar = dict[QuestionID, Question]


class FormattedQuestion(TypedDict):
    id: QuestionID
    label: str
    none: bool
    disabled: bool
    best_practices: dict[BestPracticeID, BestPractice]


class FormattedPillar(TypedDict):
    id: PillarID
    label: str
    disabled: bool
    questions: dict[QuestionID, FormattedQuestion]


class QuestionDto(BaseModel):
    none: bool | None = None
    disabled: bool | None = None


class PillarDto(BaseModel):
    disabled: bool | None = None
