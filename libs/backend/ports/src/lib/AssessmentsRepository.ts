import type { Assessment, Finding } from '@backend/models';

export interface AssessmentsRepository {
  save(assessment: Assessment): Promise<void>;
  saveFinding(args: {
    assessmentId: string;
    organization: string;
    scanningTool: string;
    finding: Finding;
  }): Promise<void>;
  get(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined>;
  getFinding(args: {
    assessmentId: string;
    findingId: string;
    scanningTool: string;
    organization: string;
  }): Promise<Finding | undefined>;
  delete(args: { assessmentId: string; organization: string }): Promise<void>;
  deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void>;
}
