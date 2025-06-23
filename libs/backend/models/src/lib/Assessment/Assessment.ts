import type { SeverityType } from '../Finding';
import type { Pillar } from '../Pillar';
import type { ScanningTool } from '../ScanningTool';

export interface Assessment {
  createdAt: Date;
  createdBy: string;
  executionArn: string;
  findings?: Pillar[];
  graphData?: AssessmentGraphData;
  id: string;
  name: string;
  organization: string;
  questionVersion?: string;
  rawGraphData: Partial<Record<ScanningTool, AssessmentGraphData>>;
  regions: string[];
  roleArn: string;
  step: AssessmentStep;
  workflows: string[];
  error?: AssessmentError;
}

export interface AssessmentGraphData {
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

export interface AssessmentBody {
  name?: string;
  graphData?: AssessmentGraphData;
  error?: AssessmentError;
}
