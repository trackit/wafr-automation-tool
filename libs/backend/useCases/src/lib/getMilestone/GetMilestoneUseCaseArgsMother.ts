import { type User, UserMother } from '@backend/models';

import type { GetMilestoneUseCaseArgs } from './GetMilestoneUseCase';

export class GetMilestoneUseCaseArgsMother {
  private data: GetMilestoneUseCaseArgs;

  private constructor(data: GetMilestoneUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetMilestoneUseCaseArgsMother {
    return new GetMilestoneUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      milestoneId: 1,
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(assessmentId: string): GetMilestoneUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withMilestoneId(milestoneId: number): GetMilestoneUseCaseArgsMother {
    this.data.milestoneId = milestoneId;
    return this;
  }

  public withRegion(region?: string): GetMilestoneUseCaseArgsMother {
    this.data.region = region;
    return this;
  }

  public withUser(user: User): GetMilestoneUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): GetMilestoneUseCaseArgs {
    return this.data;
  }
}
