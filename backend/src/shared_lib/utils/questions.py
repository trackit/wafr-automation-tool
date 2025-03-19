import datetime
import json
from pathlib import Path

from common.config import QUESTIONS_PATH
from common.entities import PillarDict
from pydantic import BaseModel


class QuestionSet(BaseModel):
    data: dict[str, PillarDict]
    version: str


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
        for p, pillar in questions.items():
            for q, question in pillar.items():
                for bp in question:
                    questions[p][q][bp] = {
                        "risk": question[bp]["risk"],
                        "status": False,
                        "results": [],
                    }
    return QuestionSet(data=questions, version=question_version)
