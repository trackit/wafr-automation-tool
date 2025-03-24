import base64
import json
from abc import abstractmethod
from typing import Any, override

from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE
from common.entities import (
    Assessment,
    AssessmentDto,
    BestPracticeExtra,
    FindingExtra,
    Pagination,
    PaginationOutput,
)
from types_boto3_dynamodb.type_defs import (
    QueryInputTableQueryTypeDef,
)
from utils.api import DecimalEncoder

from services.database import IDatabaseService


class IAssessmentService:
    @abstractmethod
    def retrieve(self, assessment_id: str) -> Assessment | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_all(self, pagination: Pagination) -> PaginationOutput[Assessment] | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        pillar_id: str,
        question_id: str,
        best_practice_id: str,
    ) -> BestPracticeExtra | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_finding(
        self,
        assessment_id: str,
        finding_id: str,
    ) -> FindingExtra | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_findings(
        self,
        assessment_id: str,
        finding_ids: list[str],
    ) -> list[FindingExtra] | None:
        raise NotImplementedError

    @abstractmethod
    def update(self, assessment_id: str, assessment_dto: AssessmentDto) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_best_practice(
        self,
        assessment: Assessment,
        pillar_id: str,
        question_id: str,
        best_practice_id: str,
        status: bool | None,
    ) -> bool:
        raise NotImplementedError

    @abstractmethod
    def delete_findings(self, assessment_id: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def delete(self, assessment_id: str) -> bool:
        raise NotImplementedError


class AssessmentService(IAssessmentService):
    def __init__(self, database_service: IDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    @override
    def retrieve(self, assessment_id: str) -> Assessment | None:
        assessment_data = self.database_service.get(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
        )
        if not assessment_data:
            return None
        return self._create_assessment(assessment_data)

    @override
    def retrieve_all(self, pagination: Pagination) -> PaginationOutput[Assessment] | None:
        query_input = self._create_retrieve_all_query_input(pagination)
        query_output = self.database_service.query(table_name=DDB_TABLE, **query_input)
        if not query_output:
            return None
        next_token = query_output.get("LastEvaluatedKey")
        assessments: list[Assessment] = []
        for item in query_output.get("Items", []):
            assessment = self._create_assessment(item)
            assessments.append(assessment)
        assessments.sort(key=lambda x: x.created_at, reverse=True)
        return PaginationOutput[Assessment](items=assessments, next_token=next_token)

    def _create_retrieve_all_query_input(self, pagination: Pagination) -> QueryInputTableQueryTypeDef:
        next_token = json.loads(base64.b64decode(pagination.next_token).decode()) if pagination.next_token else {}
        query_input = QueryInputTableQueryTypeDef(KeyConditionExpression=Key(DDB_KEY).eq(ASSESSMENT_PK))
        if pagination.limit:
            query_input["Limit"] = pagination.limit
        if pagination.filter:
            query_input["FilterExpression"] = pagination.filter
        if next_token:
            query_input["ExclusiveStartKey"] = next_token
        if pagination.attribute_name:
            query_input["ExpressionAttributeNames"] = pagination.attribute_name
        if pagination.attribute_value:
            query_input["ExpressionAttributeValues"] = pagination.attribute_value
        return query_input

    @override
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        pillar_id: str,
        question_id: str,
        best_practice_id: str,
    ) -> BestPracticeExtra | None:
        if not assessment.findings:
            return None
        pillar = assessment.findings.get(pillar_id)
        if not pillar:
            return None
        question = pillar.get("questions").get(question_id)
        if not question:
            return None
        best_practice = question.get("best_practices").get(best_practice_id)
        if not best_practice:
            return None
        findings: list[FindingExtra] | None = self.retrieve_findings(assessment.id, best_practice.get("results", []))
        if not findings:
            return None
        return BestPracticeExtra(
            id=best_practice_id,
            label=best_practice.get("label", ""),
            results=findings,
            risk=best_practice.get("risk", ""),
            status=best_practice.get("status", False),
        )

    @override
    def retrieve_finding(
        self,
        assessment_id: str,
        finding_id: str,
    ) -> FindingExtra | None:
        item = self.database_service.get(
            table_name=DDB_TABLE,
            Key={DDB_KEY: assessment_id, DDB_SORT_KEY: finding_id},
        )
        if not item:
            return None
        return self._create_finding(item)

    @override
    def retrieve_findings(
        self,
        assessment_id: str,
        finding_ids: list[str],
    ) -> list[FindingExtra] | None:
        items = self.database_service.bulk_get(
            table_name=DDB_TABLE,
            keys=[{DDB_KEY: assessment_id, DDB_SORT_KEY: finding_id} for finding_id in finding_ids],
        )
        if not items:
            return None
        findings: list[FindingExtra] = []
        for item in items:
            finding = self._create_finding(item)
            findings.append(finding)
        return findings

    @override
    def update(self, assessment_id: str, assessment_dto: AssessmentDto) -> None:
        attrs = assessment_dto.model_dump(exclude_none=True)
        self.database_service.update_attrs(
            table_name=DDB_TABLE, key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id}, attrs=attrs
        )

    @override
    def update_best_practice(
        self,
        assessment: Assessment,
        pillar_id: str,
        question_id: str,
        best_practice_id: str,
        status: bool | None,
    ) -> bool:
        if status is None:
            return False
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment.id},
            UpdateExpression="SET findings.#pillar.questions.#question.best_practices.#best_practice.#status = :status",
            ExpressionAttributeNames={
                "#pillar": pillar_id,
                "#question": question_id,
                "#best_practice": best_practice_id,
                "#status": "status",
            },
            ExpressionAttributeValues={
                ":status": status,
            },
        )
        return True

    @override
    def delete_findings(self, assessment_id: str) -> bool:
        items = self.database_service.query_all(
            table_name=DDB_TABLE,
            KeyConditionExpression=Key(DDB_KEY).eq(assessment_id),
        )
        if not items:
            return False
        keys = [{DDB_KEY: item[DDB_KEY], DDB_SORT_KEY: item[DDB_SORT_KEY]} for item in items]
        return not self.database_service.bulk_delete(table_name=DDB_TABLE, keys=keys)

    @override
    def delete(self, assessment_id: str) -> bool:
        return not self.database_service.delete(
            table_name=DDB_TABLE,
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
        )

    def _create_assessment(self, item: dict[str, Any]) -> Assessment:
        formatted_item: dict[str, Any] = json.loads(json.dumps(item, cls=DecimalEncoder))
        formatted_item["id"] = formatted_item.pop(DDB_SORT_KEY)
        return Assessment.model_validate(
            formatted_item,
        )

    def _create_finding(self, item: dict[str, Any]) -> FindingExtra:
        formatted_item: dict[str, Any] = json.loads(json.dumps(item, cls=DecimalEncoder))
        formatted_item["id"] = formatted_item.pop(DDB_SORT_KEY)
        return FindingExtra.model_validate(
            formatted_item,
        )
