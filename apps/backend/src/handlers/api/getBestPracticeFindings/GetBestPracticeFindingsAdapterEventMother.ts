import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';
import type { APIGatewayProxyEvent } from 'aws-lambda';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class GetBestPracticeFindingsAdapterEventMother {
  private queryParameters: NonNullable<
    operations['getBestPracticeFindings']['parameters']['query']
  >;
  private pathParameters: operations['getBestPracticeFindings']['parameters']['path'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    queryParameters: operations['getBestPracticeFindings']['parameters']['query'],
    pathParameters: operations['getBestPracticeFindings']['parameters']['path']
  ) {
    this.queryParameters = queryParameters || {};
    this.pathParameters = pathParameters;
  }

  public static basic(): GetBestPracticeFindingsAdapterEventMother {
    return new GetBestPracticeFindingsAdapterEventMother(
      {
        limit: undefined,
        search: undefined,
        showHidden: undefined,
        nextToken: undefined,
      },
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        pillarId: 'pillar-id',
        questionId: 'question-id',
        bestPracticeId: 'best-practice-id',
      }
    );
  }

  public withLimit(
    limit: NonNullable<
      operations['getBestPracticeFindings']['parameters']['query']
    >['limit']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryParameters.limit = limit;
    return this;
  }

  public withSearch(
    search: NonNullable<
      operations['getBestPracticeFindings']['parameters']['query']
    >['search']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryParameters.search = search;
    return this;
  }

  public withShowHidden(
    showHidden: NonNullable<
      operations['getBestPracticeFindings']['parameters']['query']
    >['showHidden']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryParameters.showHidden = showHidden;
    return this;
  }

  public withNextToken(
    nextToken: NonNullable<
      operations['getBestPracticeFindings']['parameters']['query']
    >['nextToken']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.queryParameters.nextToken = nextToken;
    return this;
  }

  public withAssessmentId(
    assessmentId: operations['getBestPracticeFindings']['parameters']['path']['assessmentId']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(
    pillarId: operations['getBestPracticeFindings']['parameters']['path']['pillarId']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: operations['getBestPracticeFindings']['parameters']['path']['questionId']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: operations['getBestPracticeFindings']['parameters']['path']['bestPracticeId']
  ): GetBestPracticeFindingsAdapterEventMother {
    this.pathParameters.bestPracticeId = bestPracticeId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetBestPracticeFindingsAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const queryStringParameters = Object.entries(this.queryParameters).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value === undefined ? undefined : String(value),
      }),
      {}
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
