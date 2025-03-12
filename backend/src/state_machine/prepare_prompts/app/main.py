from typing import Any

import boto3
from common.config import REGION
from services.database import DDBService
from services.prompt import PromptService
from services.storage import S3Service
from tasks.prepare_prompts import PreparePrompts
from utils.questions import retrieve_questions

from state_machine.event import PreparePromptsInput

ddb_client = boto3.resource("dynamodb", region_name=REGION)
database_service = DDBService(ddb_client)

s3_client = boto3.client("s3")
s3_resource = boto3.resource("s3")
storage_service = S3Service(s3_client, s3_resource)

question_set = retrieve_questions()

prompt_service = PromptService(storage_service, question_set)

prepare_prompts_task = PreparePrompts(
    database_service=database_service,
    storage_service=storage_service,
    question_set=question_set,
    prompt_service=prompt_service,
)


def lambda_handler(event: dict[str, Any], _context: Any) -> list[str]:  # noqa: ANN401
    return prepare_prompts_task.execute(PreparePromptsInput(**event))
