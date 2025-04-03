import datetime
import json
from pathlib import Path

from common.config import QUESTIONS_PATH
from entities.best_practice import BestPractice
from entities.question import FormattedPillar, FormattedQuestion, Pillar
from pydantic import BaseModel


class QuestionSet(BaseModel):
    data: dict[str, Pillar]
    version: str


class FormattedQuestionSet(BaseModel):
    data: dict[str, FormattedPillar]
    version: str


def format_questions(question_set: QuestionSet) -> FormattedQuestionSet:
    pillars: dict[str, FormattedPillar] = {}
    for pillar_index, (pillar_name, pillar_data) in enumerate(question_set.data.items()):
        questions: dict[str, FormattedQuestion] = {}
        for question_index, (question_name, question_data) in enumerate(pillar_data.items()):
            best_practices: dict[str, BestPractice] = {}
            for best_practice_index, (best_practice_name, best_practice_data) in enumerate(
                question_data.items(),
            ):
                best_practices[str(best_practice_index)] = BestPractice(
                    id=str(best_practice_index),
                    label=best_practice_name,
                    risk=best_practice_data["risk"],
                    status=False,
                    results=[],
                    hidden_results=[],
                )
            question = FormattedQuestion(
                id=str(question_index), label=question_name, best_practices=best_practices, none=False, disabled=False
            )
            questions[str(question_index)] = question
        pillar = FormattedPillar(id=str(pillar_index), label=pillar_name, questions=questions, disabled=False)
        pillars[str(pillar_index)] = pillar
    return FormattedQuestionSet(data=pillars, version=question_set.version)


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
        questions = json.load(f)
        for pillar_name, pillar in questions.items():
            for question_name, question in pillar.items():
                for best_practice_name in question:
                    questions[pillar_name][question_name][best_practice_name] = {
                        "id": best_practice_name,
                        "label": best_practice_name,
                        "risk": question[best_practice_name]["risk"],
                        "status": False,
                        "results": [],
                        "hidden_results": [],
                    }
    return QuestionSet(data=questions, version=question_version)
