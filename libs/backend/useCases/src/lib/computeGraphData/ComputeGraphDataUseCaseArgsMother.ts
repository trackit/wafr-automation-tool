import type { ComputeGraphDataUseCaseArgs } from './ComputeGraphDataUseCase';

export class ComputeGraphDataUseCaseArgsMother {
  private data: ComputeGraphDataUseCaseArgs;

  private constructor(data: ComputeGraphDataUseCaseArgs) {
    this.data = data;
  }

  public static basic(): ComputeGraphDataUseCaseArgsMother {
    return new ComputeGraphDataUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): ComputeGraphDataUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): ComputeGraphDataUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public build(): ComputeGraphDataUseCaseArgs {
    return this.data;
  }
}
