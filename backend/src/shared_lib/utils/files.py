from pathlib import Path

from common.config import CUSTODIAN_POLICIES_PATH, PROMPT_PATH


def get_prompt() -> str:
    with Path(PROMPT_PATH).open() as f:
        return f.read()


def get_custodian_policies() -> str:
    with Path(CUSTODIAN_POLICIES_PATH).open() as f:
        return f.read()
