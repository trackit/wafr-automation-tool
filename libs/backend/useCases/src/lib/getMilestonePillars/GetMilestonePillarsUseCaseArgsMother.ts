import type { GetMilestonePillarsUseCaseArgs } from './GetMilestonePillarsUseCase';

export class GetMilestonePillarsUseCaseArgsMother {
  private data: GetMilestonePillarsUseCaseArgs;

  private constructor(data: GetMilestonePillarsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetMilestonePillarsUseCaseArgsMother {
    return new GetMilestonePillarsUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      milestoneId: 1,
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetMilestonePillarsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withMilestoneId(
    milestoneId: number
  ): GetMilestonePillarsUseCaseArgsMother {
    this.data.milestoneId = milestoneId;
    return this;
  }

  public withRegion(region?: string): GetMilestonePillarsUseCaseArgsMother {
    this.data.region = region;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string
  ): GetMilestonePillarsUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): GetMilestonePillarsUseCaseArgs {
    return this.data;
  }
}
