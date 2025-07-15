import type { UpdateAssessmentUseCaseArgs } from './UpdateAssessmentUseCase';

export class UpdateAssessmentUseCaseArgsMother {
  private data: UpdateAssessmentUseCaseArgs;

  private constructor(data: UpdateAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateAssessmentUseCaseArgsMother {
    return new UpdateAssessmentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      organization: 'organization.io',
      assessmentBody: {},
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): UpdateAssessmentUseCaseArgsMother {
    this.data.organization = organization;
    return this;
  }

  public withName(name: string): UpdateAssessmentUseCaseArgsMother {
    this.data.assessmentBody = {
      ...this.data.assessmentBody,
      name,
    };
    return this;
  }

  public build(): UpdateAssessmentUseCaseArgs {
    return this.data;
  }
}
