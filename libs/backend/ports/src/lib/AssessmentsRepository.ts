import type { Assessment } from '@backend/models';

export interface AssessmentsRepository {
  save(args: {
    assessment: Assessment;
    organization: string;
  }): Promise<Assessment>;
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
