import json
from typing import override

from state_machine.event import InvokeLLMInput, StoreResultsInput
from common.task import Task
from tasks.store_results import StoreResults
from types_boto3_bedrock_runtime import BedrockRuntimeClient
from types_boto3_dynamodb import DynamoDBServiceResource
from types_boto3_s3 import S3Client
from utils.s3 import parse_s3_uri


class InvokeLLM(Task[InvokeLLMInput, None]):
    def __init__(
        self,
        s3_client: S3Client,
        bedrock_client: BedrockRuntimeClient,
        dynamodb_client: DynamoDBServiceResource,
    ):
        super().__init__()
        self.s3_client = s3_client
        self.bedrock_client = bedrock_client
        self.store_results_task = StoreResults(dynamodb_client, s3_client)

    def retrieve_prompt(self, prompt_uri: str) -> str:
        s3_bucket, s3_key = parse_s3_uri(prompt_uri)
        return (
            self.s3_client.get_object(Bucket=s3_bucket, Key=s3_key)["Body"]
            .read()
            .decode("utf-8")
        )

    def invoke_llm(self, prompt: str) -> str:
        formatted_prompt = "\n\nHuman:" + prompt + "\n\nAssistant:"
        response = self.bedrock_client.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "messages": [{"role": "user", "content": formatted_prompt}],
                    "temperature": 0,
                    "max_tokens": 4000,
                }
            ),
        )
        return response["body"].read().decode("utf-8")

    @override
    def execute(self, event: InvokeLLMInput) -> None:
        prompt = self.retrieve_prompt(event.prompt_uri)
        llm_response = self.invoke_llm(prompt)
        self.store_results_task.execute(
            StoreResultsInput(
                id=event.id, llm_response=llm_response, prompt_uri=event.prompt_uri
            )
        )
