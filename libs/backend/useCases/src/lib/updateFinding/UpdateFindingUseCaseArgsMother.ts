import { type User, UserMother } from '@backend/models';

import type { UpdateFindingUseCaseArgs } from './UpdateFindingUseCase';

export class UpdateFindingUseCaseArgsMother {
  private data: UpdateFindingUseCaseArgs;

  private constructor(data: UpdateFindingUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateFindingUseCaseArgsMother {
    return new UpdateFindingUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      findingId: 'tool#1',
      version: 1,
      user: UserMother.basic().build(),
      findingBody: {},
    });
  }

  public withAssessmentId(
    assessmentId: string,
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

  public withVersion(version: number): UpdateFindingUseCaseArgsMother {
    this.data.version = version;
    return this;
  }

  public build(): UpdateFindingUseCaseArgs {
    return this.data;
  }
}
