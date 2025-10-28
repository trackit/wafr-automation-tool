import { User, UserMother } from '@backend/models';

import type { CreateMilestoneUseCaseArgs } from './CreateMilestoneUseCase';

export class CreateMilestoneUseCaseArgsMother {
  private data: CreateMilestoneUseCaseArgs;

  private constructor(data: CreateMilestoneUseCaseArgs) {
    this.data = data;
  }

  public static basic(): CreateMilestoneUseCaseArgsMother {
    return new CreateMilestoneUseCaseArgsMother({
      user: UserMother.basic().build(),
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      name: 'Milestone Name',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): CreateMilestoneUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): CreateMilestoneUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withRegion(region?: string): CreateMilestoneUseCaseArgsMother {
    this.data.region = region;
    return this;
  }

  public withName(name: string): CreateMilestoneUseCaseArgsMother {
    this.data.name = name;
    return this;
  }

  public build(): CreateMilestoneUseCaseArgs {
    return this.data;
  }
}
