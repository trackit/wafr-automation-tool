import json
from pathlib import Path
from typing import Any


def load_file(path: Path) -> str:
    with path.open() as f:
        return f.read()


def load_json_file(path: Path) -> Any:  # noqa: ANN401
    with path.open() as f:
        return json.load(f)
