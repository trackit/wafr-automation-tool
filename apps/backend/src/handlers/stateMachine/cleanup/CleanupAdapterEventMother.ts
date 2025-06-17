import { z } from 'zod';
import { CleanupInput } from './Cleanup';

export class CleanupAdapterEventMother {
  private data: z.infer<typeof CleanupInput>;

  private constructor(data: z.infer<typeof CleanupInput>) {
    this.data = data;
  }

  public static basic(): CleanupAdapterEventMother {
    return new CleanupAdapterEventMother({
      assessment_id: 'assessment-id',
      organization: 'test.io',
      error: {
        Cause: 'test-cause',
        Error: 'test-error',
      },
    });
  }

  public withAssessmentId(
    assessmentId: z.infer<typeof CleanupInput>['assessment_id']
  ): CleanupAdapterEventMother {
    this.data.assessment_id = assessmentId;
    return this;
  }

  public withOrganization(
    organization: z.infer<typeof CleanupInput>['organization']
  ): CleanupAdapterEventMother {
    this.data.organization = organization;
    return this;
  }

  public withError(
    error: z.infer<typeof CleanupInput>['error']
  ): CleanupAdapterEventMother {
    this.data.error = error;
    return this;
  }

  public build(): z.infer<typeof CleanupInput> {
    return this.data;
  }
}
