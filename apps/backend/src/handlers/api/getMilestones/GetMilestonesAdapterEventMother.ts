import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { operations } from '@shared/api-schema';

export class GetMilestonesAdapterEventMother {
  private pathParameters: operations['getMilestones']['parameters']['path'];
  private queryStringParameters: NonNullable<
    operations['getMilestones']['parameters']['query']
  >;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    path: operations['getMilestones']['parameters']['path'],
    query: NonNullable<operations['getMilestones']['parameters']['query']>
  ) {
    this.pathParameters = path;
    this.queryStringParameters = query;
  }

  public static basic(): GetMilestonesAdapterEventMother {
    return new GetMilestonesAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {}
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): GetMilestonesAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): GetMilestonesAdapterEventMother {
    this.user.email = `${this.user.id}@${organization}`;
    return this;
  }

  public withRegion(region?: string): GetMilestonesAdapterEventMother {
    this.queryStringParameters.region = region;
    return this;
  }

  public withLimit(limit?: number): GetMilestonesAdapterEventMother {
    this.queryStringParameters.limit = limit;
    return this;
  }

  public withNextToken(nextToken?: string): GetMilestonesAdapterEventMother {
    this.queryStringParameters.nextToken = nextToken;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetMilestonesAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const queryStringParameters = Object.entries(
      this.queryStringParameters
    ).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value === undefined ? undefined : String(value),
      }),
      {}
    );
    return APIGatewayProxyEventMother.basic()
      .withUserClaims({ sub: this.user.id, email: this.user.email })
      .withPathParameters(this.pathParameters)
      .withQueryStringParameters(queryStringParameters)
      .build();
  }
}
