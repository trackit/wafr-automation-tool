import base64
import json
from abc import abstractmethod
from typing import Any, override

from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE
from common.entities import (
    Assessment,
    AssessmentDto,
    BestPractice,
    BestPracticeExtra,
    FindingExtra,
    Pagination,
    PaginationOutput,
)
from exceptions.assessment import FindingNotFoundError
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
        best_practice_name: str,
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
    def update(self, assessment_id: str, assessment_dto: AssessmentDto) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_best_practice(
        self,
        assessment: Assessment,
        best_practice_name: str,
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
        start_key = query_output.get("LastEvaluatedKey")
        assessments: list[Assessment] = []
        for item in query_output.get("Items", []):
            assessment = self._create_assessment(item)
            assessments.append(assessment)
        assessments.sort(key=lambda x: x.created_at, reverse=True)
        return PaginationOutput[Assessment](items=assessments, start_key=start_key)

    def _create_retrieve_all_query_input(self, pagination: Pagination) -> QueryInputTableQueryTypeDef:
        start_key = json.loads(base64.b64decode(pagination.start_key).decode()) if pagination.start_key else {}
        query_input = QueryInputTableQueryTypeDef(KeyConditionExpression=Key(DDB_KEY).eq(ASSESSMENT_PK))
        if pagination.limit:
            query_input["Limit"] = pagination.limit
        if pagination.filter:
            query_input["FilterExpression"] = pagination.filter
        if start_key:
            query_input["ExclusiveStartKey"] = start_key
        if pagination.attribute_name:
            query_input["ExpressionAttributeNames"] = pagination.attribute_name
        if pagination.attribute_value:
            query_input["ExpressionAttributeValues"] = pagination.attribute_value
        return query_input

    @override
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        best_practice_name: str,
    ) -> BestPracticeExtra | None:
        if not assessment.findings:
            return None
        bp_findings: BestPractice | None = None
        for pillar in assessment.findings.values():
            for question in pillar.values():
                if best_practice_name in question:
                    bp_findings = question[best_practice_name]
                    break
        if not bp_findings:
            return None
        findings: list[FindingExtra] = []
        for finding_id in bp_findings.get("results", []):
            finding = self.retrieve_finding(assessment.id, finding_id)
            if not finding:
                raise FindingNotFoundError(assessment.id, finding_id)
            findings.append(finding)
        return BestPracticeExtra(
            results=findings, risk=bp_findings.get("risk", ""), status=bp_findings.get("status", False)
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
    def update(self, assessment_id: str, assessment_dto: AssessmentDto) -> None:
        attrs = assessment_dto.model_dump(exclude_none=True)
        self.database_service.update_attrs(
            table_name=DDB_TABLE, key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id}, attrs=attrs
        )

    @override
    def update_best_practice(
        self,
        assessment: Assessment,
        best_practice_name: str,
        status: bool | None,
    ) -> bool:
        if not assessment.findings or status is None:
            return False
        bp_findings: BestPractice | None = None
        for pillar_name, pillar in assessment.findings.items():
            for question_name, question in pillar.items():
                if best_practice_name in question:
                    bp_findings = question[best_practice_name]
                    self._pillar_name = pillar_name
                    self._question_name = question_name
                    break
        if not bp_findings:
            return False
        self.database_service.update(
            table_name=DDB_TABLE,
            Key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment.id},
            UpdateExpression="SET findings.#pillar.#question.#best_practice.#status = :status",
            ExpressionAttributeNames={
                "#pillar": self._pillar_name,
                "#question": self._question_name,
                "#best_practice": best_practice_name,
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
