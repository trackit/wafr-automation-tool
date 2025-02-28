import os

REGION = os.getenv("REGION", "us-west-2")
S3_BUCKET = os.getenv("S3_BUCKET", "NONE")
DDB_TABLE = os.getenv("DYNAMODB_TABLE", "NONE")

PROWLER_OCSF_PATH = "scan/prowler/json-ocsf/prowler-output-{}.ocsf.json"
PROWLER_COMPLIANCE_PATH = "scan/prowler/compliance/prowler-output-{}"
