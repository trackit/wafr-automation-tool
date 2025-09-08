import type { User } from '@backend/models';

import type { GetBestPracticeFindingsUseCaseArgs } from './GetBestPracticeFindingsUseCase';

export class GetBestPracticeFindingsUseCaseArgsMother {
  private data: GetBestPracticeFindingsUseCaseArgs;

  private constructor(data: GetBestPracticeFindingsUseCaseArgs) {
    this.data = data;
  }

  public static basic(): GetBestPracticeFindingsUseCaseArgsMother {
    return new GetBestPracticeFindingsUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      pillarId: 'pillar-id',
      questionId: 'question-id',
      bestPracticeId: 'best-practice-id',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
      limit: 10,
      nextToken: undefined,
      searchTerm: undefined,
      showHidden: false,
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(
    pillarId: string
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: string
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: string
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.bestPracticeId = bestPracticeId;
    return this;
  }

  public withUser(user: User): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withLimit(
    limit: NonNullable<GetBestPracticeFindingsUseCaseArgs['limit']>
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(
    nextToken: NonNullable<GetBestPracticeFindingsUseCaseArgs['nextToken']>
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.nextToken = nextToken;
    return this;
  }

  public withSearchTerm(
    searchTerm: NonNullable<GetBestPracticeFindingsUseCaseArgs['searchTerm']>
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.searchTerm = searchTerm;
    return this;
  }

  public withShowHidden(
    showHidden: NonNullable<GetBestPracticeFindingsUseCaseArgs['showHidden']>
  ): GetBestPracticeFindingsUseCaseArgsMother {
    this.data.showHidden = showHidden;
    return this;
  }

  public build(): GetBestPracticeFindingsUseCaseArgs {
    return this.data;
  }
}
