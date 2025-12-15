import { type User, UserMother } from '@backend/models';

import type { StartPDFExportUseCaseArgs } from './StartPDFExportUseCase';

export class StartPDFExportUseCaseArgsMother {
  private data: StartPDFExportUseCaseArgs;

  private constructor(data: StartPDFExportUseCaseArgs) {
    this.data = data;
  }

  public static basic(): StartPDFExportUseCaseArgsMother {
    return new StartPDFExportUseCaseArgsMother({
      user: UserMother.basic().build(),
      assessmentId: 'assessment-id',
      versionName: 'version-name',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): StartPDFExportUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): StartPDFExportUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withVersionName(versionName: string): StartPDFExportUseCaseArgsMother {
    this.data.versionName = versionName;
    return this;
  }

  public build(): StartPDFExportUseCaseArgs {
    return this.data;
  }
}
