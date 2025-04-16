from unittest.mock import MagicMock

from entities.assessment import Assessment, AssessmentDto, Steps
from tests.__mocks__.fake_assessment_service import FakeAssessmentService

from state_machine.event import GenerateDataInput


def test_generate_data():
    from ..app.tasks.generate_data import GenerateData

    assessment: Assessment = Assessment(
        id="AID",
        name="Assessment",
        regions=["region1", "region2"],
        role_arn="role_arn",
        workflows=["workflow1", "workflow2"],
        step=Steps.SCANNING_STARTED,
        execution_arn="execution_arn",
        created_at="created_at",
        raw_graph_datas={
            "prowler": {
                "regions": {
                    "region1": 1,
                    "region2": 2,
                },
                "resource_types": {
                    "resource_type1": 1,
                    "resource_type2": 2,
                },
                "severities": {
                    "severity1": 1,
                    "severity2": 2,
                },
                "findings": 3,
            },
            "cloud-custodian": {
                "regions": {
                    "region1": 1,
                    "region2": 2,
                },
                "resource_types": {
                    "resource_type1": 1,
                    "resource_type2": 2,
                },
                "severities": {
                    "severity1": 1,
                    "severity2": 2,
                },
                "findings": 3,
            },
            "cloudsploit": {
                "regions": {
                    "region1": 1,
                    "region2": 2,
                },
                "resource_types": {
                    "resource_type1": 1,
                    "resource_type2": 2,
                },
                "severities": {
                    "severity1": 1,
                    "severity2": 2,
                },
                "findings": 3,
            },
        },
        graph_datas={
            "regions": {},
            "resource_types": {},
            "severities": {},
            "findings": 0,
        },
    )
    fake_assessment_service = FakeAssessmentService()
    fake_assessment_service.update_assessment = MagicMock()
    fake_assessment_service.retrieve = MagicMock(return_value=assessment)

    task_input = GenerateDataInput(assessment_id="AID")
    task = GenerateData(fake_assessment_service)
    task.execute(task_input)

    fake_assessment_service.update_assessment.assert_called_once_with(
        "AID",
        AssessmentDto(
            raw_graph_datas={},
            graph_datas={
                "regions": {
                    "region1": 3,
                    "region2": 6,
                },
                "resource_types": {
                    "resource_type1": 3,
                    "resource_type2": 6,
                },
                "severities": {
                    "severity1": 3,
                    "severity2": 6,
                },
                "findings": 9,
            },
        ),
    )
