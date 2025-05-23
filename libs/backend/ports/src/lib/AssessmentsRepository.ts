import type { Assessment } from '@backend/models';

export interface AssessmentsRepository {
  getOne(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined>;
  delete(args: { assessmentId: string; organization: string }): Promise<void>;
  deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void>;
}
