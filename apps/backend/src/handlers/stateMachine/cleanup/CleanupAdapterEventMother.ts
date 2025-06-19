import { CleanupInput } from './CleanupAdapter';

export class CleanupAdapterEventMother {
  private data: CleanupInput;

  private constructor(data: CleanupInput) {
    this.data = data;
  }

  public static basic(): CleanupAdapterEventMother {
    return new CleanupAdapterEventMother({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      error: {
        Cause: 'test-cause',
        Error: 'test-error',
      },
    });
  }

  public withAssessmentId(
    assessmentId: CleanupInput['assessmentId']
  ): CleanupAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: CleanupInput['organization']
  ): CleanupAdapterEventMother {
    this.data.organization = organization;
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
