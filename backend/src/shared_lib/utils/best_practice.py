from entities.best_practice import BestPractice
from entities.finding import FindingExtra
from entities.question import Pillar, Question

from utils.questions import QuestionSetData


def get_best_practice_by_primary_id(
    question_set: QuestionSetData, pillar_primary_id: str, question_primary_id: str, best_practice_primary_id: str
) -> tuple[Pillar, Question, BestPractice] | None:
    pillar_data = next(
        (pillar for pillar in question_set.root.values() if pillar.primary_id.lower() == pillar_primary_id.lower()),
        None,
    )
    if not pillar_data:
        return None
    question_data = next(
        (
            question
            for question in pillar_data.questions.values()
            if question.primary_id.lower() == question_primary_id.lower()
        ),
        None,
    )
    if not question_data:
        return None
    best_practice_data = next(
        (
            best_practice
            for best_practice in question_data.best_practices.values()
            if best_practice.primary_id.lower() == best_practice_primary_id.lower()
        ),
        None,
    )
    if not best_practice_data:
        return None
    return pillar_data, question_data, best_practice_data
