from pydantic import BaseModel


class PreparePromptsInput(BaseModel):
    account_id: str


class FormatProwlerInput(BaseModel):
    prowler_output: str


class InvokeLLMInput(BaseModel):
    prompt_uri: str
    account_id: str
