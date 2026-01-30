import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetBestPracticeFindingsPathParameters =
  operations['getBestPracticeFindings']['parameters']['path'];
type GetBestPracticeFindingsQueryStringParameters = NonNullable<
  operations['getBestPracticeFindings']['parameters']['query']
>;

export class GetBestPracticeFindingsAdapterEventMother {
  private pathParameters: GetBestPracticeFindingsPathParameters;
  private queryStringParameters: GetBestPracticeFindingsQueryStringParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    queryStringParameters: GetBestPracticeFindingsQueryStringParameters,
    pathParameters: GetBestPracticeFindingsPathParameters,
  ) {
    this.queryStringParameters = queryStringParameters;
    this.pathParameters = pathParameters;
  }

  public static basic(): GetBestPracticeFindingsAdapterEventMother {
    return new GetBestPracticeFindingsAdapterEventMother(
      {},
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        pillarId: 'pillar-id',
        questionId: 'question-id',
        bestPracticeId: 'best-practice-id',
      },
    );
  }

  public withLimit(limit?: number): GetBestPracticeFindingsAdapterEventMother {
    this.queryStringParameters.limit = limit;
    return this;
  }

  public withSearch(
    search?: string,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryStringParameters.search = search;
    return this;
  }

  public withShowHidden(
    showHidden?: boolean,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryStringParameters.showHidden = showHidden;
    return this;
  }

  public withNextToken(
    nextToken?: string,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryStringParameters.nextToken = nextToken;
    return this;
  }

  public withVersion(
    version: number,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryStringParameters.version = version;
    return this;
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(
    pillarId: string,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: string,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: string,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.bestPracticeId = bestPracticeId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): GetBestPracticeFindingsAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const queryStringParameters = Object.fromEntries(
      Object.entries(this.queryStringParameters).map(([key, value]) => [
        key,
        value === undefined ? undefined : String(value),
      ]),
    );
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withQueryStringParameters(queryStringParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
