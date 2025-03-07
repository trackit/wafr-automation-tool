class FindingNotFoundError(Exception):
    def __init__(self, assessment_id: str, finding_id: str) -> None:
        super().__init__(f"Finding with id {finding_id} not found in assessment with id {assessment_id}")


class InvalidPromptUriError(Exception):
    def __init__(self, prompt_uri: str) -> None:
        super().__init__(f"Invalid prompt uri: {prompt_uri}")
