import type { GetAssessmentUseCaseArgs } from './GetAssessmentUseCase';

export class GetAssessmentUseCaseArgsMother {
  private data: GetAssessmentUseCaseArgs;

  private constructor(data: GetAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentUseCaseArgsMother {
    return new GetAssessmentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'test.io',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): GetAssessmentUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public build(): GetAssessmentUseCaseArgs {
    return this.data;
  }
}
