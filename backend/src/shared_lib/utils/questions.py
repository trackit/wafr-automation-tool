import datetime
import json
import os
from pathlib import Path

from common.config import QUESTIONS_PATH
from common.entities import PILLAR
from pydantic import BaseModel


class QuestionSet(BaseModel):
    data: dict[str, PILLAR]
    version: str


def retrieve_questions() -> QuestionSet:
    question_set = [f for f in os.listdir(QUESTIONS_PATH) if f.endswith(".json") and f.startswith("questions")]
    question_set.sort(
        key=lambda x: datetime.datetime.strptime(
            x.split("_")[1].split(".")[0],
            "%m%d%Y",
        ).astimezone(datetime.UTC),
    )
    question_version = question_set[-1].split(".")[0]
    with Path(f"{QUESTIONS_PATH}/{question_set[-1]}").open() as f:
        questions = json.load(f)
        for p, pillar in questions.items():
            for q, question in pillar.items():
                for bp in question:
                    questions[p][q][bp] = []
    return QuestionSet(data=questions, version=question_version)
