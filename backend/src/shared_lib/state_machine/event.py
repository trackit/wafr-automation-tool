from typing import Any

from pydantic import BaseModel


class PreparePromptsInput(BaseModel):
    id: str
    prowler_prompts: list[str]


class FormatProwlerInput(BaseModel):
    id: str
    prowler_output: list[dict[str, Any]]


class InvokeLLMInput(BaseModel):
    id: str
    prompt_uri: str


class StoreResultsInput(BaseModel):
    id: str
    llm_response: str
    prompt_uri: str


class StateMachineError(BaseModel):
    Error: str
    Cause: str


class StateMachineException(BaseModel):
    id: str
    error: StateMachineError


class CreateProwlerPromptInput(BaseModel):
    id: str
