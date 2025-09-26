import { UserMother } from '@backend/models';

import type { GetAssessmentStepUseCaseArgs } from './GetAssessmentStepUseCase';

export class GetAssessmentStepUseCaseArgsMother {
  private data: GetAssessmentStepUseCaseArgs;

  private constructor(data: GetAssessmentStepUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentStepUseCaseArgsMother {
    return new GetAssessmentStepUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetAssessmentStepUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): GetAssessmentStepUseCaseArgsMother {
    this.data.user.organizationDomain = organization;
    return this;
  }

  public build(): GetAssessmentStepUseCaseArgs {
    return this.data;
  }
}
