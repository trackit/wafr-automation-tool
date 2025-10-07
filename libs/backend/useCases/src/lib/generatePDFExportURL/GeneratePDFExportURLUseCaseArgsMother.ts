import { User, UserMother } from '@backend/models';

import { GeneratePDFExportURLUseCaseArgs } from './GeneratePDFExportURLUseCase';

export class GeneratePDFExportURLUseCaseArgsMother {
  private data: GeneratePDFExportURLUseCaseArgs;

  private constructor(data: GeneratePDFExportURLUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GeneratePDFExportURLUseCaseArgsMother {
    return new GeneratePDFExportURLUseCaseArgsMother({
      assessmentId: 'assessment-id',
      fileExportId: 'file-export-id',
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GeneratePDFExportURLUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withFileExportId(
    fileExportId: string,
  ): GeneratePDFExportURLUseCaseArgsMother {
    this.data.fileExportId = fileExportId;
    return this;
  }

  public withUser(user: User): GeneratePDFExportURLUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): GeneratePDFExportURLUseCaseArgs {
    return this.data;
  }
}
