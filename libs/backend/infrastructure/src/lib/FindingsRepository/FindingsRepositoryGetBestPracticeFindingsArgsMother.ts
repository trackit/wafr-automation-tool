import type { AssessmentsRepositoryGetBestPracticeFindingsArgs } from '@backend/ports';

export class GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
  private data: AssessmentsRepositoryGetBestPracticeFindingsArgs;

  private constructor(data: AssessmentsRepositoryGetBestPracticeFindingsArgs) {
    this.data = data;
  }

  public static basic(): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    return new GetBestPracticeFindingsAssessmentsRepositoryArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: 'test.io',
      pillarId: 'pillar-id',
      questionId: 'question-id',
      bestPracticeId: 'best-practice-id',
      limit: 10,
      nextToken: undefined,
      searchTerm: undefined,
      showHidden: false,
    });
  }

  public withAssessmentId(
    assessmentId: AssessmentsRepositoryGetBestPracticeFindingsArgs['assessmentId'],
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: AssessmentsRepositoryGetBestPracticeFindingsArgs['organizationDomain'],
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.organizationDomain = organizationDomain;
    return this;
  }

  public withPillarId(
    pillarId: AssessmentsRepositoryGetBestPracticeFindingsArgs['pillarId'],
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: AssessmentsRepositoryGetBestPracticeFindingsArgs['questionId'],
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: AssessmentsRepositoryGetBestPracticeFindingsArgs['bestPracticeId'],
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.bestPracticeId = bestPracticeId;
    return this;
  }

  public withLimit(
    limit: NonNullable<
      AssessmentsRepositoryGetBestPracticeFindingsArgs['limit']
    >,
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(
    nextToken: NonNullable<
      AssessmentsRepositoryGetBestPracticeFindingsArgs['nextToken']
    >,
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.nextToken = nextToken;
    return this;
  }

  public withSearchTerm(
    searchTerm: NonNullable<
      AssessmentsRepositoryGetBestPracticeFindingsArgs['searchTerm']
    >,
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.searchTerm = searchTerm;
    return this;
  }

  public withShowHidden(
    showHidden: NonNullable<
      AssessmentsRepositoryGetBestPracticeFindingsArgs['showHidden']
    >,
  ): GetBestPracticeFindingsAssessmentsRepositoryArgsMother {
    this.data.showHidden = showHidden;
    return this;
  }

  public build(): AssessmentsRepositoryGetBestPracticeFindingsArgs {
    return this.data;
  }
}
