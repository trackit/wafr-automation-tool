import json
from abc import abstractmethod
from typing import Any, Optional, override

from api.config import DDB_TABLE
from common.entities import Assessment, FindingExtra
from types_boto3_dynamodb import DynamoDBServiceResource
from utils.api import DecimalEncoder


class IAssessmentRepository:
    @abstractmethod
    def retrieve_assessment(self, id: str) -> Optional[Assessment]:
        raise NotImplementedError

    @abstractmethod
    def retrieve_best_practice(
        self, assessment: Assessment, bestPracticeName: str
    ) -> Optional[list[FindingExtra]]:
        raise NotImplementedError

    @abstractmethod
    def retrieve_finding(self, id: str, finding_id: str) -> Optional[FindingExtra]:
        raise NotImplementedError

    @abstractmethod
    def delete_assessment(self, id: str) -> bool:
        raise NotImplementedError


class AssessmentRepository(IAssessmentRepository):
    def __init__(self, ddb_resource: DynamoDBServiceResource) -> None:
        self.ddb_table = ddb_resource.Table(DDB_TABLE)

    @override
    def retrieve_assessment(self, id: str) -> Optional[Assessment]:
        assessment_data = self.ddb_table.get_item(Key={"id": id, "finding_id": "0"})
        item: Optional[dict[str, Any]] = assessment_data.get("Item", None)
        if not item:
            return None
        # findings: Optional[dict[str, Any]] = item.get("findings", None)
        formatted_item = json.loads(json.dumps(item, cls=DecimalEncoder))
        return Assessment(
            **formatted_item,
        )

    @override
    def retrieve_best_practice(
        self, assessment: Assessment, bestPracticeName: str
    ) -> Optional[list[FindingExtra]]:
        if not assessment.findings:
            return None
        bp_findings: list[int] = []
        for _, pillar in assessment.findings.items():
            for _, question in pillar.items():
                if bestPracticeName in question:
                    bp_findings = question[bestPracticeName]
                    break
        print(f"Best practice findings: {bp_findings}")
        findings: list[FindingExtra] = []
        for finding_id in bp_findings:
            finding = self.retrieve_finding(assessment.id, str(finding_id))
            if not finding:
                raise Exception(f"Finding {finding_id} not found")
            findings.append(finding)
        return findings

    @override
    def retrieve_finding(self, id: str, finding_id: str) -> Optional[FindingExtra]:
        finding_data = self.ddb_table.get_item(Key={"id": id, "finding_id": finding_id})
        item: Optional[dict[str, Any]] = finding_data.get("Item", None)
        if not item:
            return None
        return FindingExtra(
            **item,
        )

    @override
    def delete_assessment(self, id: str) -> bool:
        response = self.ddb_table.query(
            KeyConditionExpression="id = :id",
            ExpressionAttributeValues={":id": id},
        )
        items = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            response = self.ddb_table.query(
                KeyConditionExpression="id = :id",
                ExpressionAttributeValues={":id": id},
                ExclusiveStartKey=response["LastEvaluatedKey"],
            )
            items.extend(response.get("Items", []))

        if not items:
            return False
        with self.ddb_table.batch_writer() as batch:
            for item in items:
                key = {"id": item["id"], "finding_id": item["finding_id"]}
                batch.delete_item(Key=key)
        return True
