import json

# ddb_resource = boto3.resource("dynamodb")
# database_service = DDBService(ddb_resource)
# assessment_service = AssessmentService(database_service)
# task = UpdateAssessment(assessment_service)


def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Minimal Lambda OK"}),
    }


# def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
#    try:
#        return {
#                "statusCode": 200,
#                "body": json.dumps({"oui": "stop here"}),
#            }
#        auth_header = get_bearer_token(event)
#        body = json.loads(event["body"])
#        assessement_dto = AssessmentDto(**body)
#        response = task.execute(
#            UpdateAssessmentInput(
#                assessment_id=event["pathParameters"]["assessmentId"], assessment_dto=assessement_dto, owner_id=auth_header
#            ),
#        )
#        return response.build()
#    except UnauthorizedError as e:
#        return {
#            "statusCode": 401,
#            "body": json.dumps({"error": str(e)}),
#        }
#    except ValidationError as e:
#        return {
#            "statusCode": 400,
#            "body": json.dumps({"error": e.errors()}),
#        }
