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
    resolve: bool
    best_practices: dict[BestPracticeID, BestPractice]


class FormattedPillar(TypedDict):
    id: PillarID
    label: str
    questions: dict[QuestionID, FormattedQuestion]


class QuestionDto(BaseModel):
    resolve: bool | None = None
