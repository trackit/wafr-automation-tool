from typing import Any

import boto3
from common.config import REGION
from services.database import DDBService
from services.storage import S3Service
from tasks.prepare_prompts import PreparePrompts
from tasks.prowler.create_prowler_prompt import CreateProwlerPrompt

from state_machine.event import CreateProwlerPromptInput, PreparePromptsInput

s3_client = boto3.client("s3")
s3_resource = boto3.resource("s3")
ddb_client = boto3.resource("dynamodb", region_name=REGION)
database_service = DDBService(ddb_client)
storage_service = S3Service(s3_client, s3_resource)

create_prowler_prompt_task = CreateProwlerPrompt(storage_service)

prepare_prompts_task = PreparePrompts(database_service, storage_service)


def lambda_handler(event: dict[str, Any], _context: Any) -> list[str]:
    prowler_prompts = create_prowler_prompt_task.execute(
        CreateProwlerPromptInput(**event),
    )
    prepare_prompts_input = PreparePromptsInput(
        **event,
        prowler_prompts=prowler_prompts,
    )
    return prepare_prompts_task.execute(prepare_prompts_input)
