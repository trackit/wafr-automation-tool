import os

REGION = os.getenv("REGION", "us-west-2")
S3_BUCKET = os.getenv("S3_BUCKET", "NONE")
DDB_TABLE = os.getenv("DDB_TABLE", "NONE")
STATE_MACHINE_ARN = os.getenv("STATE_MACHINE_ARN", "NONE")

DDB_KEY = "PK"
DDB_SORT_KEY = "SK"
DDB_ASSESSMENT_SK = "0"

WAFR_JSON_PLACEHOLDER = "[WAFRJSON]"
PROWLER_JSON_PLACEHOLDER = "[ProwlerJSON]"

PROWLER_OCSF_PATH = "scan/prowler/json-ocsf/prowler-output-{}.ocsf.json"
PROWLER_COMPLIANCE_PATH = "scan/prowler/compliance/prowler-output-{}"

STORE_CHUNK_PATH = "{}/chunks/chunk-{}.json"
STORE_PROMPT_PATH = "{}/prompts/prompt-{}.txt"

PROWLER_PROMPT_PATH = "./prompts/prowler.txt"
SCRIPTS_PATH = "./scripts"
