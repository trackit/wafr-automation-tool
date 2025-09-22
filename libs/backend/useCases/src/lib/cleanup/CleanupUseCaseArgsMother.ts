import type { CleanupUseCaseArgs, StateMachineError } from './CleanupUseCase';

export class CleanupUseCaseArgsMother {
  private data: CleanupUseCaseArgs;

  private constructor(data: CleanupUseCaseArgs) {
    this.data = data;
  }

  public static basic(): CleanupUseCaseArgsMother {
    return new CleanupUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      error: {
        Cause: 'test-cause',
        Error: 'test-error',
      },
    });
  }

  public withAssessmentId(assessmentId: string): CleanupUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string
  ): CleanupUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withError(
    error: StateMachineError | undefined
  ): CleanupUseCaseArgsMother {
    this.data.error = error;
    return this;
  }

  public build(): CleanupUseCaseArgs {
    return this.data;
  }
}
