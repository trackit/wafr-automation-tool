import os

DDB_TABLE = os.getenv("DYNAMODB_TABLE", "NONE")
STATE_MACHINE_ARN = os.getenv("STATE_MACHINE_ARN", "NONE")
