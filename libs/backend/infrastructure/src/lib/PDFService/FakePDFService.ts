import { type Assessment } from '@backend/models';
import type { PDFServicePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakePDFService implements PDFServicePort {
  public async exportAssessment(_args: {
    assessment: Assessment;
    versionName: string;
  }): Promise<Buffer> {
    // No-op for fake implementation
    return Buffer.alloc(0);
  }
}

export const tokenFakePDFService = createInjectionToken<FakePDFService>(
  'FakePDFService',
  { useClass: FakePDFService },
);
