import type { GetBillingInformationUseCaseArgs } from './GetBillingInformationUseCase';

export class GetBillingInformationUseCaseArgsMother {
  private data: GetBillingInformationUseCaseArgs;

  private constructor(data: GetBillingInformationUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetBillingInformationUseCaseArgsMother {
    return new GetBillingInformationUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetBillingInformationUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetBillingInformationUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): GetBillingInformationUseCaseArgs {
    return this.data;
  }
}
