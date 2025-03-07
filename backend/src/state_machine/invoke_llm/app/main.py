from typing import Any

import boto3
from common.config import REGION
from services.ai import BedrockService
from services.database import DDBService
from services.storage import S3Service
from tasks.invoke_llm import InvokeLLM
from tasks.store_results import StoreResults
from utils.questions import retrieve_questions

from state_machine.event import InvokeLLMInput, StoreResultsInput

ddb_client = boto3.resource("dynamodb", region_name=REGION)
database_service = DDBService(ddb_client)

s3_client = boto3.client("s3")
s3_resource = boto3.resource("s3")
storage_service = S3Service(s3_client, s3_resource)

bedrock_client = boto3.client("bedrock-runtime", region_name=REGION)
ai_service = BedrockService(bedrock_client)

invoke_llm_task = InvokeLLM(storage_service, ai_service)
store_results_task = StoreResults(database_service, storage_service, retrieve_questions())


def lambda_handler(event: dict[str, Any], _context: Any) -> None:  # noqa: ANN401
    llm_response = invoke_llm_task.execute(InvokeLLMInput(**event))
    store_results_task.execute(StoreResultsInput(**event, llm_response=llm_response))
