import {
  FindingMetadata,
  FindingRemediation,
  FindingResource,
  SeverityType,
} from '@backend/models';

export interface DynamoDBFinding {
  PK: string;
  SK: string;
  bestPractices: string;
  hidden: boolean;
  id: string;
  isAIAssociated: boolean;
  metadata: FindingMetadata;
  remediation?: FindingRemediation;
  resources?: FindingResource[];
  riskDetails?: string;
  severity?: SeverityType;
  statusCode?: string;
  statusDetail?: string;
}
