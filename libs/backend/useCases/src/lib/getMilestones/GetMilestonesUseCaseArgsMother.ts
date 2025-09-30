import type { GetMilestonesUseCaseArgs } from './GetMilestonesUseCase';

export class GetMilestonesUseCaseArgsMother {
  private data: GetMilestonesUseCaseArgs;

  private constructor(data: GetMilestonesUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetMilestonesUseCaseArgsMother {
    return new GetMilestonesUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      region: 'us-west-2',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetMilestonesUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withRegion(
    region: string | undefined,
  ): GetMilestonesUseCaseArgsMother {
    this.data.region = region;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetMilestonesUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): GetMilestonesUseCaseArgs {
    return this.data;
  }
}
