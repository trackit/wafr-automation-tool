from pathlib import Path

from common.config import PROMPT_PATH


def get_prompt() -> str:
    with Path(PROMPT_PATH).open() as f:
        return f.read()
