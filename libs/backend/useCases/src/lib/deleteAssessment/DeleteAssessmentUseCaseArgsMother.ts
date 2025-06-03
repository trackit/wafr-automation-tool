import type { User } from '@backend/models';
import type { DeleteAssessmentUseCaseArgs } from './DeleteAssessmentUseCase';

export class DeleteAssessmentUseCaseArgsMother {
  private data: DeleteAssessmentUseCaseArgs;

  private constructor(data: DeleteAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): DeleteAssessmentUseCaseArgsMother {
    return new DeleteAssessmentUseCaseArgsMother({
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
  ): DeleteAssessmentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): DeleteAssessmentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): DeleteAssessmentUseCaseArgs {
    return this.data;
  }
}
