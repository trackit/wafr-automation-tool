import type { SeverityType } from './Finding';

export interface DynamoDBFinding {
  PK: string;
  SK: string;
  best_practices: string;
  hidden: boolean;
  id: string;
  is_ai_associated: boolean;
  metadata: DynamoDBFindingMetadata;
  remediation?: DynamoDBFindingRemediation;
  resources?: DynamoDBFindingResource[];
  risk_details?: string;
  severity?: SeverityType;
  status_code?: string;
  status_detail?: string;
}

export interface DynamoDBFindingMetadata {
  event_code?: string;
}

export interface DynamoDBFindingRemediation {
  desc: string;
  references?: string[];
}

export interface DynamoDBFindingResource {
  name?: string;
  region?: string;
  type?: string;
  uid?: string;
}
