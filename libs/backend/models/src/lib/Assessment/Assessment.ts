import type { SeverityType } from '../Finding';
import type { Pillar } from '../Pillar';
import type { ScanningTool } from '../ScanningTool';

export interface Assessment {
  createdAt: Date;
  createdBy: string;
  executionArn: string;
  pillars?: Pillar[];
  graphData?: AssessmentGraphData;
  id: string;
  name: string;
  organization: string;
  questionVersion?: string;
  rawGraphData: Partial<Record<ScanningTool, AssessmentGraphData>>;
  regions: string[];
  exportRegion?: string;
  roleArn: string;
  workflows: string[];
  finishedAt?: Date;
  error?: AssessmentError;
  fileExports?: AssessmentFileExports;
  wafrWorkloadArn?: string;
  opportunityId?: string;
  opportunityCreatedAt?: Date;
}

export interface AssessmentGraphData {
  findings: number;
  regions: Record<string, number>;
  resourceTypes: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}

export enum AssessmentStep {
  SCANNING_STARTED = 'SCANNING_STARTED',
  PREPARING_ASSOCIATIONS = 'PREPARING_ASSOCIATIONS',
  ASSOCIATING_FINDINGS = 'ASSOCIATING_FINDINGS',
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
  finishedAt?: Date;
  rawGraphData?: Partial<Record<ScanningTool, AssessmentGraphData>>;
  pillars?: Pillar[];
  questionVersion?: string;
  exportRegion?: string;
  fileExports?: AssessmentFileExports;
  wafrWorkloadArn?: string;
  opportunityId?: string;
  executionArn?: string;
  opportunityCreatedAt?: Date;
}

export enum AssessmentFileExportType {
  PDF = 'pdf',
}

export type AssessmentFileExports = Partial<
  Record<AssessmentFileExportType, AssessmentFileExport[]>
>;

export enum AssessmentFileExportStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERRORED = 'ERRORED',
}

export interface AssessmentFileExport {
  id: string;
  status: AssessmentFileExportStatus;
  error?: string;
  versionName: string;
  objectKey?: string;
  createdAt: Date;
}
