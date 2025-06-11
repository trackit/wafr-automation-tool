import type { Assessment, User } from '@backend/models';
import type { UpdateAssessmentUseCaseArgs } from './UpdateAssessmentUseCase';

export class UpdateAssessmentUseCaseArgsMother {
  private data: UpdateAssessmentUseCaseArgs;

  private constructor(data: UpdateAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateAssessmentUseCaseArgsMother {
    return new UpdateAssessmentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
      assessmentBody: {
        name: 'Test Assessment',
      },
    });
  }

  public withAssessmentId(
    assessmentId: Assessment['id']
  ): UpdateAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): UpdateAssessmentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withName(
    name: Partial<Assessment>['name']
  ): UpdateAssessmentUseCaseArgsMother {
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
