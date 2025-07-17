import { AssessmentStep, ScanningTool, SeverityType } from '@backend/models';
import { DynamoDBPillar } from './DynamoDBPillar';

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
