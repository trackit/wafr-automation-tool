import type { User } from '@backend/models';

import type { DeleteAssessmentUseCaseArgs } from './DeleteAssessmentUseCase';

export class DeleteAssessmentUseCaseArgsMother {
  private data: DeleteAssessmentUseCaseArgs;

  private constructor(data: DeleteAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): DeleteAssessmentUseCaseArgsMother {
    return new DeleteAssessmentUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
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
