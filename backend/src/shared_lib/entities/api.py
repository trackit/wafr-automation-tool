from typing import Any, TypedDict

from pydantic import BaseModel
from types_boto3_dynamodb.type_defs import (
    ConditionBaseImportTypeDef,
    TableAttributeValueTypeDef,
)

from entities.assessment import AssessmentID, Steps
from entities.best_practice import BestPractice
from entities.question import PillarID, QuestionID


class APIFormattedQuestion(TypedDict):
    id: QuestionID
    label: str
    none: bool
    disabled: bool
    best_practices: list[BestPractice]


class APIFormattedPillar(TypedDict):
    id: PillarID
    label: str
    disabled: bool
    questions: list[APIFormattedQuestion]


class APIAssessment(BaseModel):
    id: AssessmentID
    name: str
    region: list[str]
    role_arn: str
    created_at: str
    step: Steps
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: list[APIFormattedPillar] | None = None


class APIPagination(BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    limit: int
    next_token: str | None = None
    filter_expression: ConditionBaseImportTypeDef | None = None
    attribute_name: dict[str, str] | None = None
    attribute_value: dict[str, Any] | None = None


class APIPaginationOutput[T](BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    items: list[T]
    next_token: dict[str, TableAttributeValueTypeDef] | None
