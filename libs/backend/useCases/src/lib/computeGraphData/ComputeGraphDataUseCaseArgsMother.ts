import type { ComputeGraphDataUseCaseArgs } from './ComputeGraphDataUseCase';

export class ComputeGraphDataUseCaseArgsMother {
  private data: ComputeGraphDataUseCaseArgs;

  private constructor(data: ComputeGraphDataUseCaseArgs) {
    this.data = data;
  }

  public static basic(): ComputeGraphDataUseCaseArgsMother {
    return new ComputeGraphDataUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): ComputeGraphDataUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string
  ): ComputeGraphDataUseCaseArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public build(): ComputeGraphDataUseCaseArgs {
    return this.data;
  }
}
