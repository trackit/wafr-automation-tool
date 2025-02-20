import json
from typing import override

from common.event import InvokeLLMInput
from common.task import Task
from types_boto3_bedrock_runtime import BedrockRuntimeClient
from types_boto3_s3 import S3Client
from utils.s3 import parse_s3_uri


class InvokeLLM(Task[InvokeLLMInput, None]):
    def __init__(self, s3_client: S3Client, bedrock_client: BedrockRuntimeClient):
        super().__init__()
        self.s3_client = s3_client
        self.bedrock_client = bedrock_client

    def retrieve_prompt(self, s3_bucket: str, s3_key: str) -> str:
        return (
            self.s3_client.get_object(Bucket=s3_bucket, Key=s3_key)["Body"]
            .read()
            .decode("utf-8")
        )

    def invoke_llm(self, prompt: str) -> str:
        response = self.bedrock_client.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0,
                    "max_tokens": 4000,
                }
            ),
        )
        return response["body"].read().decode("utf-8")

    def store_result(self, s3_bucket: str, s3_key: str, body: str) -> None:
        self.s3_client.put_object(
            Bucket=s3_bucket,
            Key=f"results/{s3_key.split('/')[-1]}",
            Body=body,
        )

    @override
    def execute(self, event: InvokeLLMInput) -> None:
        s3_bucket, s3_key = parse_s3_uri(event.prompt_uri)
        prompt = self.retrieve_prompt(s3_bucket, s3_key)
        formatted_prompt = "\n\nHuman:" + prompt + "\n\nAssistant:"
        llm_response = self.invoke_llm(formatted_prompt)
        self.store_result(s3_bucket, s3_key, llm_response)
