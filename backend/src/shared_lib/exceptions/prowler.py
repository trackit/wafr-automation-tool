class NotDetectionFindingError(Exception):
    def __init__(self, index: int) -> None:
        super().__init__(f"Item {index} is not a DetectionFinding")
