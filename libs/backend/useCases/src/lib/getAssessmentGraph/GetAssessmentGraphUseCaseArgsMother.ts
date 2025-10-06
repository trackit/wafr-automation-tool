import { UserMother } from '@backend/models';

import type { GetAssessmentGraphUseCaseArgs } from './GetAssessmentGraphUseCase';

export class GetAssessmentGraphUseCaseArgsMother {
  private data: GetAssessmentGraphUseCaseArgs;

  private constructor(data: GetAssessmentGraphUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentGraphUseCaseArgsMother {
    return new GetAssessmentGraphUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetAssessmentGraphUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): GetAssessmentGraphUseCaseArgsMother {
    this.data.user.organizationDomain = organization;
    return this;
  }

  public build(): GetAssessmentGraphUseCaseArgs {
    return this.data;
  }
}
