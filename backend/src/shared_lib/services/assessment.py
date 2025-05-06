import base64
import json
from abc import abstractmethod
from typing import Any, override

from boto3.dynamodb.conditions import Key
from common.config import ASSESSMENT_PK, DDB_KEY, DDB_SORT_KEY, DDB_TABLE
from entities.api import APIBestPracticeExtra, APIPagination, APIPaginationOutput
from entities.assessment import Assessment, AssessmentData, AssessmentDto, AssessmentID
from entities.best_practice import BestPracticeDto, BestPracticeID
from entities.database import UpdateAttrsInput
from entities.finding import FindingDto, FindingExtra, FindingID
from entities.question import PillarDto, PillarID, QuestionDto, QuestionID
from types_boto3_dynamodb.type_defs import (
    QueryInputTableQueryTypeDef,
)
from utils.api import DecimalEncoder

from services.database import IDatabaseService


class IAssessmentService:
    @abstractmethod
    def retrieve(self, assessment_id: AssessmentID, owner_id: str | None = None) -> Assessment | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_all(self, pagination: APIPagination) -> APIPaginationOutput[Assessment]:
        raise NotImplementedError

    @abstractmethod
    def retrieve_api_best_practice(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
    ) -> APIBestPracticeExtra | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_finding(
        self,
        assessment_id: AssessmentID,
        owner_id: str,
        finding_id: FindingID,
    ) -> FindingExtra | None:
        raise NotImplementedError

    @abstractmethod
    def retrieve_findings(
        self,
        assessment_id: AssessmentID,
        finding_ids: list[str],
    ) -> list[FindingExtra] | None:
        raise NotImplementedError

    @abstractmethod
    def update_assessment(
        self, assessment_id: AssessmentID, assessment_dto: AssessmentDto, owner_id: str | None = None
    ) -> bool:
        raise NotImplementedError

    @abstractmethod
    def update_pillar(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        pillar_dto: PillarDto,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_question(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        question_dto: QuestionDto,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_best_practice(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
        best_practice_dto: BestPracticeDto,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_finding(  # noqa: PLR0913
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
        finding_id: FindingID,
        finding_dto: FindingDto,
    ) -> bool:
        raise NotImplementedError

    @abstractmethod
    def delete_findings(self, assessment: Assessment) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete(self, assessment_id: AssessmentID) -> None:
        raise NotImplementedError


class AssessmentService(IAssessmentService):
    def __init__(self, database_service: IDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    @override
    def retrieve(self, assessment_id: AssessmentID, owner_id: str | None = None) -> Assessment | None:
        assessment_data = self.database_service.get(
            table_name=DDB_TABLE,
            Key={
                DDB_KEY: ASSESSMENT_PK,
                DDB_SORT_KEY: assessment_id,
            },
        )
        if not assessment_data:
            return None

        if owner_id is not None and assessment_data.get("owner_id") != owner_id:
            return None

        return self._create_assessment(assessment_data)

    @override
    def retrieve_all(self, pagination: APIPagination) -> APIPaginationOutput[Assessment]:
        query_input = self._create_retrieve_all_query_input(pagination)
        query_output = self.database_service.query(table_name=DDB_TABLE, **query_input)
        next_token = query_output.get("LastEvaluatedKey")
        assessments: list[Assessment] = []
        for item in query_output.get("Items", []):
            assessment = self._create_assessment(item)
            assessments.append(assessment)
        return APIPaginationOutput[Assessment](items=assessments, next_token=next_token)

    def _create_retrieve_all_query_input(self, pagination: APIPagination) -> QueryInputTableQueryTypeDef:
        next_token = json.loads(base64.b64decode(pagination.next_token).decode()) if pagination.next_token else {}
        query_input = QueryInputTableQueryTypeDef(
            KeyConditionExpression=Key(DDB_KEY).eq(ASSESSMENT_PK),
            ScanIndexForward=False,
        )
        if pagination.limit:
            query_input["Limit"] = pagination.limit
        if pagination.filter_expression:
            query_input["FilterExpression"] = pagination.filter_expression
        if next_token:
            query_input["ExclusiveStartKey"] = next_token
        if pagination.attribute_name:
            query_input["ExpressionAttributeNames"] = pagination.attribute_name
        if pagination.attribute_value:
            query_input["ExpressionAttributeValues"] = pagination.attribute_value
        return query_input

    @override
    def retrieve_api_best_practice(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
    ) -> APIBestPracticeExtra | None:
        if not assessment.findings:
            return None
        pillar = assessment.findings.root.get(pillar_id)
        if not pillar:
            return None
        question = pillar.questions.get(question_id)
        if not question:
            return None
        best_practice = question.best_practices.get(best_practice_id)
        if not best_practice:
            return None
        findings: list[FindingExtra] | None = self.retrieve_findings(assessment.id, best_practice.results)
        best_practice_data = {**best_practice.model_dump()}
        best_practice_data["results"] = findings if findings else []
        return APIBestPracticeExtra(**best_practice_data)

    @override
    def retrieve_finding(
        self,
        assessment_id: AssessmentID,
        owner_id: str,
        finding_id: FindingID,
    ) -> FindingExtra | None:
        item = self.database_service.get(
            table_name=DDB_TABLE,
            Key={DDB_KEY: assessment_id, DDB_SORT_KEY: finding_id},
        )
        if not item:
            return None
        if item.get("owner_id") != owner_id:
            return None
        return self._create_finding(item)

    @override
    def retrieve_findings(
        self,
        assessment_id: AssessmentID,
        finding_ids: list[str],
    ) -> list[FindingExtra] | None:
        if not finding_ids:
            return None
        items = self.database_service.bulk_get(
            table_name=DDB_TABLE,
            keys=[{DDB_KEY: assessment_id, DDB_SORT_KEY: finding_id} for finding_id in finding_ids],
        )
        findings: list[FindingExtra] = []
        for item in items:
            finding = self._create_finding(item)
            findings.append(finding)
        return findings

    @override
    def update_assessment(
        self, assessment_id: AssessmentID, assessment_dto: AssessmentDto, owner_id: str | None = None
    ) -> bool:
        existing = self.retrieve(
            assessment_id=assessment_id,
            owner_id=owner_id,
        )
        if not existing:
            return False

        attrs = assessment_dto.model_dump(exclude_none=True)
        event = UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
            attrs=attrs,
        )
        self.database_service.update_attrs(table_name=DDB_TABLE, event=event)
        return True

    @override
    def update_pillar(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        pillar_dto: PillarDto,
    ) -> None:
        attrs = pillar_dto.model_dump(exclude_none=True)
        event = UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment.id},
            update_expression_path="findings.#pillar.",
            expression_attribute_names={
                "#pillar": pillar_id,
            },
            attrs=attrs,
        )
        self.database_service.update_attrs(table_name=DDB_TABLE, event=event)

    @override
    def update_question(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        question_dto: QuestionDto,
    ) -> None:
        attrs = question_dto.model_dump(exclude_none=True)
        event = UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment.id},
            update_expression_path="findings.#pillar.questions.#question.",
            expression_attribute_names={
                "#pillar": pillar_id,
                "#question": question_id,
            },
            attrs=attrs,
        )
        self.database_service.update_attrs(table_name=DDB_TABLE, event=event)

    @override
    def update_best_practice(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
        best_practice_dto: BestPracticeDto,
    ) -> None:
        attrs = best_practice_dto.model_dump(exclude_none=True)
        event = UpdateAttrsInput(
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment.id},
            update_expression_path="findings.#pillar.questions.#question.best_practices.#best_practice.",
            expression_attribute_names={
                "#pillar": pillar_id,
                "#question": question_id,
                "#best_practice": best_practice_id,
            },
            attrs=attrs,
        )
        self.database_service.update_attrs(table_name=DDB_TABLE, event=event)

    @override
    def update_finding(
        self,
        assessment: Assessment,
        pillar_id: PillarID,
        question_id: QuestionID,
        best_practice_id: BestPracticeID,
        finding_id: FindingID,
        finding_dto: FindingDto,
    ) -> bool:
        attrs = finding_dto.model_dump(exclude_none=True)
        event = UpdateAttrsInput(
            key={DDB_KEY: assessment.id, DDB_SORT_KEY: finding_id},
            attrs=attrs,
        )
        self.database_service.update_attrs(table_name=DDB_TABLE, event=event)
        if not assessment.findings:
            return False
        pillar = assessment.findings.root.get(pillar_id)
        if not pillar:
            return False
        question = pillar.questions.get(question_id)
        if not question:
            return False
        best_practice = question.best_practices.get(best_practice_id)
        if not best_practice:
            return False
        if finding_dto.hidden:
            if finding_id in best_practice.hidden_results:
                return True
            best_practice.hidden_results.append(finding_id)
        else:
            best_practice.hidden_results.remove(finding_id)
        assessment_dto = AssessmentDto(findings=assessment.findings.root)
        self.update_assessment(assessment.id, assessment_dto)
        return True

    @override
    def delete_findings(self, assessment: Assessment) -> None:
        items: set[str] = set()
        if not assessment.findings:
            return
        for pillar in assessment.findings.root.values():
            for question in pillar.questions.values():
                for best_practice in question.best_practices.values():
                    items.update(best_practice.results)
        keys = [{DDB_KEY: assessment.id, DDB_SORT_KEY: item} for item in items]
        self.database_service.bulk_delete(table_name=DDB_TABLE, keys=keys)

    @override
    def delete(self, assessment_id: AssessmentID) -> None:
        self.database_service.delete(
            table_name=DDB_TABLE,
            key={DDB_KEY: ASSESSMENT_PK, DDB_SORT_KEY: assessment_id},
        )

    def _create_assessment(self, item: dict[str, Any]) -> Assessment:
        formatted_item: dict[str, Any] = json.loads(json.dumps(item, cls=DecimalEncoder))
        formatted_item["id"] = formatted_item.pop(DDB_SORT_KEY)
        if "workflow" in formatted_item:
            formatted_item["workflows"] = [formatted_item.pop("workflow")]
        if "graph_datas" not in formatted_item:
            formatted_item["graph_datas"] = AssessmentData(regions={}, resource_types={}, severities={}, findings=0)
        return Assessment.model_validate(
            formatted_item,
        )

    def _create_finding(self, item: dict[str, Any]) -> FindingExtra:
        formatted_item: dict[str, Any] = json.loads(json.dumps(item, cls=DecimalEncoder))
        formatted_item["id"] = formatted_item.pop(DDB_SORT_KEY)
        return FindingExtra.model_validate(
            formatted_item,
        )
