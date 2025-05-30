import type { SeverityType } from '../Finding';
import type { DynamoDBPillar } from '../Pillar';

export interface DynamoDBAssessment {
  PK: string;
  SK: string;
  created_at: string;
  created_by: string;
  execution_arn: string;
  findings: Record<string, DynamoDBPillar>;
  graph_datas: DynamoDBAssessmentGraphDatas;
  id: string;
  name: string;
  organization: string;
  question_version: string;
  raw_graph_datas: Record<string, DynamoDBAssessmentGraphDatas>;
  regions: string[];
  role_arn: string;
  workflows: string[];
}

export interface DynamoDBAssessmentGraphDatas {
  findings: number;
  regions: Record<string, number>;
  resource_types: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}
