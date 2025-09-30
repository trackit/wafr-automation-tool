import z from 'zod';

import { ExportPDFSchema } from './ExportPDFAdapter';

type ExportPDFParameters = z.infer<typeof ExportPDFSchema>;

export class ExportPDFAdapterEventMother {
  private params: ExportPDFParameters;

  private constructor(params: ExportPDFParameters) {
    this.params = params;
  }

  public static basic(): ExportPDFAdapterEventMother {
    return new ExportPDFAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      fileExportId: 'file-export-id',
    });
  }

  public withAssessmentId(assessmentId: string): ExportPDFAdapterEventMother {
    this.params.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string
  ): ExportPDFAdapterEventMother {
    this.params.organizationDomain = organizationDomain;
    return this;
  }

  public withFileExportId(fileExportId: string): ExportPDFAdapterEventMother {
    this.params.fileExportId = fileExportId;
    return this;
  }

  public build(): Record<string, unknown> {
    return this.params;
  }
}
