import type { UpdateAssessmentUseCaseArgs } from './UpdateAssessmentUseCase';

export class UpdateAssessmentUseCaseArgsMother {
  private data: UpdateAssessmentUseCaseArgs;

  private constructor(data: UpdateAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateAssessmentUseCaseArgsMother {
    return new UpdateAssessmentUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'organization.io',
      assessmentBody: {},
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): UpdateAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organization: string,
  ): UpdateAssessmentUseCaseArgsMother {
    this.data.organizationDomain = organization;
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
