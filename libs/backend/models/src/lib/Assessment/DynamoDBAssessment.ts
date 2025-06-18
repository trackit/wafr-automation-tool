import type { SeverityType } from '../Finding';
import type { DynamoDBPillar } from '../Pillar';
import type { ScanningTool } from '../ScanningTool';
import type { AssessmentStep } from './Assessment';

export interface DynamoDBAssessment {
  PK: string;
  SK: string;
  created_at: string;
  created_by: string;
  execution_arn: string;
  findings?: Record<string, DynamoDBPillar>;
  graph_datas?: DynamoDBAssessmentGraphDatas;
  id: string;
  name: string;
  organization: string;
  question_version?: string;
  raw_graph_datas: Partial<Record<ScanningTool, DynamoDBAssessmentGraphDatas>>;
  regions: string[];
  role_arn: string;
  step: AssessmentStep;
  workflows: string[];
  error?: DynamoDBAssessmentError;
}

export interface DynamoDBAssessmentGraphDatas {
  findings: number;
  regions: Record<string, number>;
  resource_types: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}

export interface DynamoDBAssessmentError {
  Cause: string;
  Error: string;
}
