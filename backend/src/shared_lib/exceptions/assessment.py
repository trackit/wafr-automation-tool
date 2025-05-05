from entities.ai import PromptS3Uri
from entities.assessment import AssessmentID
from entities.finding import FindingID


class FindingNotFoundError(Exception):
    def __init__(self, assessment_id: AssessmentID, finding_id: FindingID) -> None:
        super().__init__(f"Finding with id {finding_id} not found in assessment with id {assessment_id}")


class InvalidPromptUriError(Exception):
    def __init__(self, prompt_uri: PromptS3Uri) -> None:
        super().__init__(f"Invalid prompt uri: {prompt_uri}")
