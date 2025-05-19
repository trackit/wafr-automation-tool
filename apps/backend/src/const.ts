export const Debug = process.env.DEBUG === 'true';
export const Region = process.env.REGION || 'us-west-2';
export const S3Bucket = process.env.S3_BUCKET || 'NONE';
export const DDBTable = process.env.DDB_TABLE || 'test-table';
export const StateMachineArn =
  process.env.STATE_MACHINE_ARN || 'test-state-machine';

export const DDB_KEY = 'PK';
export const DDB_SORT_KEY = 'SK';

export const ASSESSMENT_PK = 'ASSESSMENT';

export const SCANNING_TOOL_TITLE_PLACEHOLDER = '[SCANNING_TOOL_TITLE]';
export const SCANNING_TOOL_DATA_PLACEHOLDER = '[SCANNING_TOOL_DATA]';
export const QUESTION_SET_DATA_PLACEHOLDER = '[QUESTION_SET_DATA]';
export const PROMPT_PATH = './data/prompt.txt';
export const CUSTODIAN_POLICIES_PATH = './policies/policies.yml';
export const CUSTODIAN_FILE_NAME = 'custodian.yml';

// export const PROWLER_OCSF_PATH =
//   'assessments/{}/scans/prowler/json-ocsf/output.ocsf.json';
// export const PROWLER_COMPLIANCE_PATH =
//   'assessments/{}/scans/prowler/compliance/output';
// export const CLOUD_CUSTODIAN_PATH =
//   'assessments/{}/scans/cloud-custodian/';
// export const CLOUDSPLOIT_OUTPUT_PATH =
//   'assessments/{}/scans/cloudsploit/output.json';

// export const STORE_CHUNK_PATH =
//   'assessments/{}/chunks/{}.json';
// export const STORE_PROMPT_PATH =
//   'assessments/{}/prompts_variables/{}.txt';

export const QUESTIONS_PATH = './questions';

export const CHUNK_SIZE = 400;
