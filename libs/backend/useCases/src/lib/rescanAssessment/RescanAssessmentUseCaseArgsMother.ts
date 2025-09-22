import { type User, UserMother } from '@backend/models';

import type { RescanAssessmentUseCaseArgs } from './RescanAssessmentUseCase';

export class RescanAssessmentUseCaseArgsMother {
  private data: RescanAssessmentUseCaseArgs;

  private constructor(data: RescanAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): RescanAssessmentUseCaseArgsMother {
    return new RescanAssessmentUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      user: UserMother.basic().build(),
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
