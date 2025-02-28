import os

S3_BUCKET = os.getenv("S3_BUCKET", "NONE")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "NONE")

PROWLER_OCSF_PATH = "scan/prowler/json-ocsf/prowler-output-{}.ocsf.json"
PROWLER_COMPLIANCE_PATH = "scan/prowler/compliance/prowler-output-{}"
