import json
from abc import abstractmethod
from typing import override

from boto3.dynamodb.conditions import Key
from common.config import DDB_ASSESSMENT_SK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE
from common.entities import Assessment, FindingExtra
from utils.api import DecimalEncoder

from services.database import IDatabaseService


class IAssessmentService:
    @abstractmethod
    def retrieve_assessment(self, assessment_id: str) -> Assessment | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_all_assessments(self) -> list[Assessment] | None:
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
    def delete_assessment(self, assessment_id: str) -> bool:
        raise NotImplementedError


class AssessmentService(IAssessmentService):
    def __init__(self, database_service: IDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    @override
    def retrieve_assessment(self, assessment_id: str) -> Assessment | None:
        assessment_data = self.database_service.get(
            table_name=DDB_TABLE,
            Key={DDB_KEY: assessment_id, DDB_SORT_KEY: DDB_ASSESSMENT_SK},
        )
        if not assessment_data:
            return None
        formatted_item = json.loads(json.dumps(assessment_data, cls=DecimalEncoder))
        return Assessment(
            **formatted_item,
        )

    @override
    def retrieve_all_assessments(self) -> list[Assessment] | None:
        items = self.database_service.query(
            table_name=DDB_TABLE,
            KeyConditionExpression=Key(DDB_SORT_KEY).eq(DDB_ASSESSMENT_SK),
        )
        if not items:
            return None
        assessments: list[Assessment] = []
        for item in items:
            formatted_item = json.loads(json.dumps(item, cls=DecimalEncoder))
            assessment = Assessment(**formatted_item)
            assessment.findings = None
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
                raise Exception(f"Finding {finding_id} not found")
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
        formatted_item = json.loads(json.dumps(item, cls=DecimalEncoder))
        return FindingExtra(
            **formatted_item,
        )

    @override
    def delete_assessment(self, assessment_id: str) -> bool:
        items = self.database_service.query(
            table_name=DDB_TABLE,
            KeyConditionExpression=Key(DDB_KEY).eq(id),
        )
        if not items:
            return False
        keys = [{DDB_KEY: item["id"], DDB_SORT_KEY: item["finding_id"]} for item in items]
        self.database_service.bulk_delete(table_name=DDB_TABLE, keys=keys)
        return True
