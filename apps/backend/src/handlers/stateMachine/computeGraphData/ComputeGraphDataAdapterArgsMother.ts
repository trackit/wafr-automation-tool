import { ComputeGraphDataInput } from './ComputeGraphDataAdapter';

export class ComputeGraphDataAdapterArgsMother {
  private data: ComputeGraphDataInput;

  private constructor(data: ComputeGraphDataInput) {
    this.data = data;
  }

  public static basic(): ComputeGraphDataAdapterArgsMother {
    return new ComputeGraphDataAdapterArgsMother({
      assessmentId: 'e21c0679-4b87-46a9-9a8e-45f2728c0cf2',
      organization: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): ComputeGraphDataAdapterArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): ComputeGraphDataAdapterArgsMother {
    this.data.organization = organization;
    return this;
  }

  public build(): ComputeGraphDataInput {
    return this.data;
  }
}
