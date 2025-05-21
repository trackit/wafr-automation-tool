from typing import Any, TypedDict

from pydantic import BaseModel
from types_boto3_dynamodb.type_defs import (
    ConditionBaseImportTypeDef,
    TableAttributeValueTypeDef,
)

from entities.assessment import AssessmentData, AssessmentID, Steps
from entities.best_practice import BestPractice, BestPracticeID
from entities.finding import FindingExtra
from entities.question import PillarID, QuestionID

WorkloadId = str


class APIBestPracticeExtra(BaseModel):
    id: BestPracticeID
    label: str
    description: str = ""
    risk: str
    status: bool
    results: list[FindingExtra]
    hidden_results: list[str]


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
    regions: list[str]
    role_arn: str
    workflows: list[str]
    created_at: str
    step: Steps
    graph_datas: AssessmentData | None = None
    error: dict[str, Any] | None = None
    question_version: str | None = None
    findings: list[APIFormattedPillar] | None = None
    created_by: str
    organization: str


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
