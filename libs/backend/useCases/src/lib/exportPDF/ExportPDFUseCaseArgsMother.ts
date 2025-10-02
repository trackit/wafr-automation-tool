import type { ExportPDFUseCaseArgs } from './ExportPDFUseCase';

export class ExportPDFUseCaseArgsMother {
  private data: ExportPDFUseCaseArgs;

  private constructor(data: ExportPDFUseCaseArgs) {
    this.data = data;
  }

  public static basic(): ExportPDFUseCaseArgsMother {
    return new ExportPDFUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organizationDomain: 'test.io',
      fileExportId: 'file-export-id',
    });
  }

  public withAssessmentId(assessmentId: string): ExportPDFUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): ExportPDFUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withFileExportId(fileExportId: string): ExportPDFUseCaseArgsMother {
    this.data.fileExportId = fileExportId;
    return this;
  }

  public build(): ExportPDFUseCaseArgs {
    return this.data;
  }
}
