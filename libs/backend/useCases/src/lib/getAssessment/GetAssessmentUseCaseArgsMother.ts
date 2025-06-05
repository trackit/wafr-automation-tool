import type { User } from '@backend/models';
import type { GetAssessmentUseCaseArgs } from './GetAssessmentUseCase';

export class GetAssessmentUseCaseArgsMother {
  private data: GetAssessmentUseCaseArgs;

  private constructor(data: GetAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetAssessmentUseCaseArgsMother {
    return new GetAssessmentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): GetAssessmentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): GetAssessmentUseCaseArgs {
    return this.data;
  }
}
