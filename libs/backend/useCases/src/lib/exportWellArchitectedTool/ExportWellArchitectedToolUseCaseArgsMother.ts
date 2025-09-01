import { User, UserMother } from '@backend/models';

import type { ExportWellArchitectedToolUseCaseArgs } from './ExportWellArchitectedToolUseCase';

export class ExportWellArchitectedToolUseCaseArgsMother {
  private data: ExportWellArchitectedToolUseCaseArgs;

  private constructor(data: ExportWellArchitectedToolUseCaseArgs) {
    this.data = data;
  }

  public static basic(): ExportWellArchitectedToolUseCaseArgsMother {
    return new ExportWellArchitectedToolUseCaseArgsMother({
      user: UserMother.basic().build(),
      assessmentId: 'assessment-id',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): ExportWellArchitectedToolUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): ExportWellArchitectedToolUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withRegion(
    region?: string
  ): ExportWellArchitectedToolUseCaseArgsMother {
    this.data.region = region;
    return this;
  }

  public build(): ExportWellArchitectedToolUseCaseArgs {
    return this.data;
  }
}
