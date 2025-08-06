import {
  AssessmentStep,
  FindingComment,
  FindingMetadata,
  FindingRemediation,
  FindingResource,
  ScanningTool,
  SeverityType,
} from '@backend/models';

export interface DynamoDBAssessment {
  PK: string;
  SK: string;
  createdAt: string;
  createdBy: string;
  executionArn: string;
  pillars?: Record<string, DynamoDBPillar>;
  graphData?: DynamoDBAssessmentGraphData;
  id: string;
  name: string;
  organization: string;
  questionVersion?: string;
  rawGraphData: Partial<Record<ScanningTool, DynamoDBAssessmentGraphData>>;
  regions: string[];
  roleArn: string;
  step: AssessmentStep;
  workflows: string[];
  error?: DynamoDBAssessmentError;
}

export interface DynamoDBAssessmentGraphData {
  findings: number;
  regions: Record<string, number>;
  resourceTypes: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}

export interface DynamoDBAssessmentError {
  cause: string;
  error: string;
}

export interface DynamoDBBestPractice {
  description: string;
  id: string;
  label: string;
  primaryId: string;
  results: Set<string>;
  risk: SeverityType;
  checked: boolean;
}

export interface DynamoDBFinding {
  PK: string;
  SK: string;
  bestPractices: string;
  hidden: boolean;
  id: string;
  isAIAssociated: boolean;
  comments?: Record<string, FindingComment>;
  metadata: FindingMetadata;
  remediation?: FindingRemediation;
  resources?: FindingResource[];
  riskDetails?: string;
  severity?: SeverityType;
  statusCode?: string;
  statusDetail?: string;
}

export interface DynamoDBPillar {
  disabled: boolean;
  id: string;
  label: string;
  primaryId: string;
  questions: Record<string, DynamoDBQuestion>;
}

export interface DynamoDBQuestion {
  bestPractices: Record<string, DynamoDBBestPractice>;
  disabled: boolean;
  id: string;
  label: string;
  none: boolean;
  primaryId: string;
}
