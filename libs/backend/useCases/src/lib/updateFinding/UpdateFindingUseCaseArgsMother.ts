import type { User } from '@backend/models';
import type { UpdateFindingUseCaseArgs } from './UpdateFindingUseCase';

export class UpdateFindingUseCaseArgsMother {
  private data: UpdateFindingUseCaseArgs;

  private constructor(data: UpdateFindingUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateFindingUseCaseArgsMother {
    return new UpdateFindingUseCaseArgsMother({
      assessmentId: 'assessment-id',
      findingId: 'tool#1',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
      findingBody: {},
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateFindingUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): UpdateFindingUseCaseArgsMother {
    this.data.findingId = findingId;
    return this;
  }

  public withHidden(hidden: boolean): UpdateFindingUseCaseArgsMother {
    this.data.findingBody = {
      ...this.data.findingBody,
      hidden,
    };
    return this;
  }

  public withUser(user: User): UpdateFindingUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): UpdateFindingUseCaseArgs {
    return this.data;
  }
}
