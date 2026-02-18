import type { GetAssessmentUseCaseArgs } from './GetAssessmentUseCase';

export class GetAssessmentUseCaseArgsMother {
  private data: GetAssessmentUseCaseArgs;

  private constructor(data: GetAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentUseCaseArgsMother {
    return new GetAssessmentUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetAssessmentUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withVersion(
    version: number | undefined,
  ): GetAssessmentUseCaseArgsMother {
    this.data.version = version;
    return this;
  }

  public build(): GetAssessmentUseCaseArgs {
    return this.data;
  }
}
