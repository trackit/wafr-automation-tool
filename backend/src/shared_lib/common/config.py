import os

DEBUG = os.getenv("DEBUG", "false") == "true"
REGION = os.getenv("REGION", "us-west-2")
S3_BUCKET = os.getenv("S3_BUCKET", "NONE")
DDB_TABLE = os.getenv("DDB_TABLE", "test-table")
STATE_MACHINE_ARN = os.getenv("STATE_MACHINE_ARN", "test-state-machine")

DDB_KEY = "PK"
DDB_SORT_KEY = "SK"

ASSESSMENT_SK = "ASSESSMENT#{}"
FINDING_SK = "ASSESSMENT#{}#{}"

SCANNING_TOOL_TITLE_PLACEHOLDER = "[SCANNING_TOOL_TITLE]"
SCANNING_TOOL_DATA_PLACEHOLDER = "[SCANNING_TOOL_DATA]"
QUESTION_SET_DATA_PLACEHOLDER = "[QUESTION_SET_DATA]"
PROMPT_PATH = "./data/prompt.txt"
CUSTODIAN_POLICIES_PATH = "./policies/policies.yml"
CUSTODIAN_FILE_NAME = "custodian.yml"
FILTERING_RULES_PATH = "./filtering/filtering.json"

PROWLER_OCSF_PATH = "assessments/{}/scans/prowler/json-ocsf/output.ocsf.json"
PROWLER_COMPLIANCE_PATH = "assessments/{}/scans/prowler/compliance/output"
CLOUD_CUSTODIAN_PATH = "assessments/{}/scans/cloud-custodian/"
CLOUDSPLOIT_OUTPUT_PATH = "assessments/{}/scans/cloudsploit/output.json"

STORE_CHUNK_PATH = "assessments/{}/chunks/{}.json"
STORE_PROMPT_PATH = "assessments/{}/prompts_variables/{}.txt"

QUESTIONS_PATH = "./questions"

CHUNK_SIZE = 400
