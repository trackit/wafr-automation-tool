import datetime
import json
from pathlib import Path

from common.config import QUESTIONS_PATH
from entities.best_practice import BestPractice
from entities.question import Pillar, Question, RawPillar
from pydantic import BaseModel, RootModel


class QuestionSetData(RootModel):
    root: dict[str, Pillar]


class QuestionSet(BaseModel):
    data: QuestionSetData
    version: str


class RawQuestionSet(RootModel):
    root: dict[str, RawPillar]


def _format_questions(question_version: str, questions_set: RawQuestionSet) -> QuestionSet:
    question_data = QuestionSet(data=QuestionSetData({}), version=question_version)
    for pillar_id, pillar in questions_set.root.items():
        questions: dict[str, Question] = {}
        for question_id, question in pillar.questions.items():
            best_practices: dict[str, BestPractice] = {}
            for best_practice_id, best_practice in question.best_practices.items():
                best_practices[best_practice_id] = BestPractice(
                    **best_practice.model_dump(), id=best_practice_id, results=[], hidden_results=[], status=False
                )
            questions[question_id] = Question(
                id=question_id,
                primary_id=question.primary_id,
                label=question.label,
                best_practices=best_practices,
                none=False,
                disabled=False,
            )
        question_data.data.root[pillar_id] = Pillar(
            id=pillar_id,
            primary_id=pillar.primary_id,
            label=pillar.label,
            questions=questions,
            disabled=False,
        )
    return question_data


def retrieve_questions() -> QuestionSet:
    question_set = [
        f.name for f in Path(QUESTIONS_PATH).iterdir() if f.name.endswith(".json") and f.name.startswith("questions")
    ]
    question_set.sort(
        key=lambda x: datetime.datetime.strptime(
            x.split("_")[1].split(".")[0],
            "%m%d%Y",
        ).astimezone(datetime.UTC),
    )
    question_version = question_set[-1].split(".")[0]
    with Path(f"{QUESTIONS_PATH}/{question_set[-1]}").open() as f:
        questions_set: RawQuestionSet = RawQuestionSet(**json.load(f))
    return _format_questions(question_version, questions_set)
