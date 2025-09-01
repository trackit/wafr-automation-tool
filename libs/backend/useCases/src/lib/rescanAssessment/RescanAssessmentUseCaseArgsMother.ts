import type { User } from '@backend/models';

import type { RescanAssessmentUseCaseArgs } from './RescanAssessmentUseCase';

export class RescanAssessmentUseCaseArgsMother {
  private data: RescanAssessmentUseCaseArgs;

  private constructor(data: RescanAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): RescanAssessmentUseCaseArgsMother {
    return new RescanAssessmentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): RescanAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): RescanAssessmentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): RescanAssessmentUseCaseArgs {
    return this.data;
  }
}
