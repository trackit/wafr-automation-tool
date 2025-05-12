import json
from pathlib import Path

from common.config import CUSTODIAN_POLICIES_PATH, FILTERING_RULES_PATH, PROMPT_PATH
from entities.finding import FilteringRules


def get_prompt() -> str:
    with Path(PROMPT_PATH).open() as f:
        return f.read()


def get_custodian_policies() -> str:
    with Path(CUSTODIAN_POLICIES_PATH).open() as f:
        return f.read()


def get_filtering_rules() -> FilteringRules:
    with Path(FILTERING_RULES_PATH).open() as f:
        return FilteringRules(**json.loads(f.read()))
