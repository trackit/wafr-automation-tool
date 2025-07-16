import type { SeverityType } from './Finding';

export interface DynamoDBFinding {
  PK: string;
  SK: string;
  bestPractices: string;
  hidden: boolean;
  id: string;
  isAIAssociated: boolean;
  metadata: DynamoDBFindingMetadata;
  remediation?: DynamoDBFindingRemediation;
  resources?: DynamoDBFindingResource[];
  riskDetails?: string;
  severity?: SeverityType;
  statusCode?: string;
  statusDetail?: string;
}

export interface DynamoDBFindingMetadata {
  eventCode?: string;
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
