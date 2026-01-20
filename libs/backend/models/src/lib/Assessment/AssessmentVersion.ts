import { type Pillar } from '../Pillar';
import { type AssessmentError } from './Assessment';

export interface AssessmentVersion {
  version: number;
  assessmentId: string;
  createdAt: Date;
  createdBy: string;
  executionArn: string;
  pillars?: Pillar[];
  finishedAt?: Date;
  error?: AssessmentError;
  wafrWorkloadArn?: string;
  exportRegion?: string;
}

export interface AssessmentVersionBody {
  executionArn?: string;
  finishedAt?: Date;
  error?: AssessmentError;
  wafrWorkloadArn?: string;
  exportRegion?: string;
}
