import json
from abc import abstractmethod
from typing import Any, override

from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE
from common.entities import Assessment, AssessmentDto, FindingExtra
from exceptions.assessment import FindingNotFoundError
from utils.api import DecimalEncoder

from services.database import IDatabaseService


class IAssessmentService:
    @abstractmethod
    def retrieve(self, assessment_id: str) -> Assessment | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_all(self) -> list[Assessment] | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        best_practice_name: str,
    ) -> list[FindingExtra] | None:
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
    def retrieve_all(self) -> list[Assessment] | None:
        items = self.database_service.query(
            table_name=DDB_TABLE,
            KeyConditionExpression=Key(DDB_KEY).eq(ASSESSMENT_PK),
        )
        if not items:
            return None
        assessments: list[Assessment] = []
        for item in items:
            assessment = self._create_assessment(item)
            assessments.append(assessment)
        return assessments

    @override
    def retrieve_best_practice(
        self,
        assessment: Assessment,
        best_practice_name: str,
    ) -> list[FindingExtra] | None:
        if not assessment.findings:
            return None
        bp_findings: list[int] = []
        for pillar in assessment.findings.values():
            for question in pillar.values():
                if best_practice_name in question:
                    bp_findings = question[best_practice_name]
                    break
        findings: list[FindingExtra] = []
        for finding_id in bp_findings:
            finding = self.retrieve_finding(assessment.id, str(finding_id))
            if not finding:
                raise FindingNotFoundError(assessment.id, str(finding_id))
            findings.append(finding)
        return findings

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
        attrs = assessment_dto.dict()
        attrs = {k: v for k, v in attrs.items() if v is not None}
        self.database_service.update_attrs(
            table_name=DDB_TABLE, key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id}, attrs=attrs
        )

    @override
    def delete_findings(self, assessment_id: str) -> bool:
        items = self.database_service.query(
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
        return Assessment(
            **formatted_item,
        )

    def _create_finding(self, item: dict[str, Any]) -> FindingExtra:
        formatted_item: dict[str, Any] = json.loads(json.dumps(item, cls=DecimalEncoder))
        formatted_item["id"] = formatted_item.pop(DDB_SORT_KEY)
        return FindingExtra(
            **formatted_item,
        )
