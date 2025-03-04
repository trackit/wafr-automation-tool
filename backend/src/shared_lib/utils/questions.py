import datetime
import json
import os
from pathlib import Path
from typing import Any

from common.config import QUESTIONS_PATH
from pydantic import BaseModel


class QuestionsOutput(BaseModel):
    questions: dict[str, Any]
    question_version: str


def retrieve_questions() -> QuestionsOutput:
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
    return QuestionsOutput(questions=questions, question_version=question_version)
