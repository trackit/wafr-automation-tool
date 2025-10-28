import { CleanupInput } from './CleanupAdapter';

export class CleanupAdapterEventMother {
  private data: CleanupInput;

  private constructor(data: CleanupInput) {
    this.data = data;
  }

  public static basic(): CleanupAdapterEventMother {
    return new CleanupAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      error: {
        Cause: 'test-cause',
        Error: 'test-error',
      },
    });
  }

  public withAssessmentId(
    assessmentId: CleanupInput['assessmentId'],
  ): CleanupAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: CleanupInput['organizationDomain'],
  ): CleanupAdapterEventMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withError(error: CleanupInput['error']): CleanupAdapterEventMother {
    this.data.error = error;
    return this;
  }

  public build(): CleanupInput {
    return this.data;
  }
}
