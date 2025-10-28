import { z } from 'zod';

import { tokenExportPDFUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export const ExportPDFSchema = z.object({
  assessmentId: z.uuid(),
  organizationDomain: z.string(),
  fileExportId: z.string(),
});

export class ExportPDFAdapter {
  private readonly useCase = inject(tokenExportPDFUseCase);

  public async handle(event: Record<string, unknown>): Promise<void> {
    const parsedEvent = ExportPDFSchema.parse(event);
    await this.useCase.exportPDF(parsedEvent);
  }
}
