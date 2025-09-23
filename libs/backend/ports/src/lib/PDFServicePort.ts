import { Assessment } from '@backend/models';

export interface PDFServicePort {
  exportAssessment(args: {
    assessment: Assessment;
    versionName: string;
  }): Promise<Buffer>;
}
