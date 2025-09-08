import type { BestPracticeBody, User } from '@backend/models';

import type { UpdateBestPracticeUseCaseArgs } from './UpdateBestPracticeUseCase';

export class UpdateBestPracticeUseCaseArgsMother {
  private data: UpdateBestPracticeUseCaseArgs;

  private constructor(data: UpdateBestPracticeUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateBestPracticeUseCaseArgsMother {
    return new UpdateBestPracticeUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
      pillarId: '0',
      questionId: '0',
      bestPracticeId: '0',
      bestPracticeBody: {},
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateBestPracticeUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): UpdateBestPracticeUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withPillarId(pillarId: string): UpdateBestPracticeUseCaseArgsMother {
    this.data.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: string
  ): UpdateBestPracticeUseCaseArgsMother {
    this.data.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: string
  ): UpdateBestPracticeUseCaseArgsMother {
    this.data.bestPracticeId = bestPracticeId;
    return this;
  }

  public withBestPracticeBody(
    bestPracticeBody: BestPracticeBody
  ): UpdateBestPracticeUseCaseArgsMother {
    this.data.bestPracticeBody = bestPracticeBody;
    return this;
  }

  public build(): UpdateBestPracticeUseCaseArgs {
    return this.data;
  }
}
