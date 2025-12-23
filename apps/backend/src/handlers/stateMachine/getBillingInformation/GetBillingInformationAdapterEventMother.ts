import { type GetBillingInformationInput } from './GetBillingInformationAdapter';

export class GetBillingInformationAdapterEventMother {
  private data: GetBillingInformationInput;

  private constructor(data: GetBillingInformationInput) {
    this.data = data;
  }

  public static basic(): GetBillingInformationAdapterEventMother {
    return new GetBillingInformationAdapterEventMother({
      assessmentId: 'e21c0679-4b87-46a9-9a8e-45f2728c0cf2',
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetBillingInformationAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetBillingInformationAdapterEventMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): GetBillingInformationInput {
    return this.data;
  }
}
