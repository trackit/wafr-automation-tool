import json
from typing import Any

from common.models import Claude3Dot5Sonnet


def test_claude3dot5sonnet():
    model = Claude3Dot5Sonnet()
    prompt = "test-prompt"
    formatted_prompt = model.prompt_format.format(prompt)
    body: dict[str, Any] = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [{"role": "user", "content": formatted_prompt}],
        "temperature": model.temperature,
        "max_tokens": model.max_tokens,
    }
    result = {
        "modelId": model.model_id,
        "body": json.dumps(body, separators=(",", ":")),
    }
    assert model.build(prompt=prompt) == result
