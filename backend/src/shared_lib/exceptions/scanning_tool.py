class InvalidScanningToolError(Exception):
    def __init__(self, scanning_tool: str) -> None:
        super().__init__(f"Invalid scanning tool: {scanning_tool}")


class InvalidPolicyError(Exception):
    def __init__(self, policy: str) -> None:
        super().__init__(f"Invalid policy: {policy}")
