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
      organizationDomain: 'test.io',
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

  public withOrganizationDomain(
    organizationDomain: string
  ): GetMilestoneUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): GetMilestoneUseCaseArgs {
    return this.data;
  }
}
