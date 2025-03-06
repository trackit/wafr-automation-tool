class InvalidScanningToolError(Exception):
    def __init__(self, scanning_tool: str) -> None:
        super().__init__(f"Invalid scanning tool: {scanning_tool}")
