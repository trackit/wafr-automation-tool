import type { SeverityType } from '../Finding';
import type { Pillar } from '../Pillar';

export interface Assessment {
  createdAt: Date;
  createdBy: string;
  executionArn: string;
  findings: Pillar[];
  graphDatas: AssessmentGraphDatas;
  id: string;
  name: string;
  organization: string;
  questionVersion: string;
  rawGraphDatas: Record<string, AssessmentGraphDatas>;
  regions: string[];
  roleArn: string;
  workflows: string[];
}

export interface AssessmentGraphDatas {
  findings: number;
  regions: Record<string, number>;
  resourceTypes: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}
