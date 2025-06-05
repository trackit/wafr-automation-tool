import type { SeverityType } from '../Finding';
import type { Pillar } from '../Pillar';

export interface Assessment {
  createdAt: Date;
  createdBy: string;
  executionArn: string;
  findings?: Pillar[];
  graphDatas?: AssessmentGraphDatas;
  id: string;
  name: string;
  organization: string;
  questionVersion?: string;
  rawGraphDatas: Record<string, AssessmentGraphDatas>;
  regions: string[];
  roleArn: string;
  step: AssessmentStep;
  workflows: string[];
  error?: AssessmentError;
}

export interface AssessmentGraphDatas {
  findings: number;
  regions: Record<string, number>;
  resourceTypes: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}

export enum AssessmentStep {
  SCANNING_STARTED = 'SCANNING_STARTED',
  PREPARING_PROMPTS = 'PREPARING_PROMPTS',
  INVOKING_LLM = 'INVOKING_LLM',
  FINISHED = 'FINISHED',
  ERRORED = 'ERRORED',
}

export interface AssessmentError {
  cause: string;
  error: string;
}
