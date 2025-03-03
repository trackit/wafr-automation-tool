import os

REGION = os.getenv("REGION", "us-west-2")
S3_BUCKET = os.getenv("S3_BUCKET", "NONE")
DDB_TABLE = os.getenv("DYNAMODB_TABLE", "NONE")
STATE_MACHINE_ARN = os.getenv("STATE_MACHINE_ARN", "NONE")

DDB_KEY = "PK"
DDB_SORT_KEY = "SK"
DDB_ASSESSMENT_SK = "0"

PROWLER_OCSF_PATH = "scan/prowler/json-ocsf/prowler-output-{}.ocsf.json"
PROWLER_COMPLIANCE_PATH = "scan/prowler/compliance/prowler-output-{}"

STORE_CHUNK_PATH = "{}/chunks/chunk-{}.json"
STORE_PROMPT_PATH = "{}/prompts/prompt-{}.txt"

PROMPT_PATH = "./prompt.txt"
SCRIPTS_PATH = "./scripts"
