import { User, UserMother } from '@backend/models';

import { DeletePDFExportUseCaseArgs } from './DeletePDFExportUseCase';

export class DeletePDFExportUseCaseArgsMother {
  private data: DeletePDFExportUseCaseArgs;

  private constructor(data: DeletePDFExportUseCaseArgs) {
    this.data = data;
  }

  public static basic(): DeletePDFExportUseCaseArgsMother {
    return new DeletePDFExportUseCaseArgsMother({
      assessmentId: 'assessment-id',
      fileExportId: 'file-export-id',
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): DeletePDFExportUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withFileExportId(
    fileExportId: string,
  ): DeletePDFExportUseCaseArgsMother {
    this.data.fileExportId = fileExportId;
    return this;
  }

  public withUser(user: User): DeletePDFExportUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): DeletePDFExportUseCaseArgs {
    return this.data;
  }
}
