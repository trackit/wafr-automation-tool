class InvalidAIModelError(Exception):
    def __init__(self, model: str) -> None:
        super().__init__(f"Invalid AI model: {model}")
