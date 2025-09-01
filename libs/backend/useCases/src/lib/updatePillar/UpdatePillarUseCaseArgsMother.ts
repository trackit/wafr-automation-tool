import type { PillarBody, User } from '@backend/models';

import type { UpdatePillarUseCaseArgs } from './UpdatePillarUseCase';

export class UpdatePillarUseCaseArgsMother {
  private data: UpdatePillarUseCaseArgs;

  private constructor(data: UpdatePillarUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdatePillarUseCaseArgsMother {
    return new UpdatePillarUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
      pillarId: '0',
      pillarBody: {},
    });
  }

  public withAssessmentId(assessmentId: string): UpdatePillarUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): UpdatePillarUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withPillarId(pillarId: string): UpdatePillarUseCaseArgsMother {
    this.data.pillarId = pillarId;
    return this;
  }

  public withPillarBody(pillarBody: PillarBody): UpdatePillarUseCaseArgsMother {
    this.data.pillarBody = pillarBody;
    return this;
  }

  public build(): UpdatePillarUseCaseArgs {
    return this.data;
  }
}
