import os

from common.entities import AIModel
from common.models import Claude3Dot5Sonnet, Claude3Dot7Sonnet, IModel

DEBUG = os.getenv("DEBUG", "false") == "true"
REGION = os.getenv("REGION", "us-west-2")
S3_BUCKET = os.getenv("S3_BUCKET", "NONE")
DDB_TABLE = os.getenv("DDB_TABLE", "test-table")
STATE_MACHINE_ARN = os.getenv("STATE_MACHINE_ARN", "test-state-machine")

DDB_KEY = "PK"
DDB_SORT_KEY = "SK"

ASSESSMENT_PK = "ASSESSMENT"

WAFR_JSON_PLACEHOLDER = "[WAFRJSON]"
PROWLER_JSON_PLACEHOLDER = "[ProwlerJSON]"
CLOUDSPLOIT_JSON_PLACEHOLDER = "[CloudSploitJSON]"

PROWLER_OCSF_PATH = "scans/{}/prowler/json-ocsf/output.ocsf.json"
PROWLER_COMPLIANCE_PATH = "scans/{}/prowler/compliance/output"

CLOUDSPLOIT_OUTPUT_PATH = "scans/{}/cloudsploit/output.json"

STORE_CHUNK_PATH = "{}/chunks/chunk-{}.json"
STORE_PROMPT_PATH = "{}/prompts/prompt-{}.txt"

PROWLER_PROMPT_PATH = "./prompts/prowler.txt"
CLOUDSPLOIT_PROMPT_PATH = "./prompts/cloudsploit.txt"
QUESTIONS_PATH = "./questions"


AI_MODELS: dict[str, type[IModel]] = {
    AIModel.Claude3Dot5Sonnet: Claude3Dot5Sonnet,
    AIModel.Claude3Dot7Sonnet: Claude3Dot7Sonnet,
}
AI_MODEL = os.getenv("AI_MODEL", "claude-3-5-sonnet")
