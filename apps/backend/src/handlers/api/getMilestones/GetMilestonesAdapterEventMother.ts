import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetMilestonesPathParameters =
  operations['getMilestones']['parameters']['path'];
type GetMilestonesQueryStringParameters = NonNullable<
  operations['getMilestones']['parameters']['query']
>;

export class GetMilestonesAdapterEventMother {
  private pathParameters: GetMilestonesPathParameters;
  private queryStringParameters: GetMilestonesQueryStringParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: GetMilestonesPathParameters,
    queryStringParameters: GetMilestonesQueryStringParameters,
  ) {
    this.pathParameters = pathParameters;
    this.queryStringParameters = queryStringParameters;
  }

  public static basic(): GetMilestonesAdapterEventMother {
    return new GetMilestonesAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {},
    );
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetMilestonesAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetMilestonesAdapterEventMother {
    this.user.email = `${this.user.id}@${organizationDomain}`;
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
    user: Pick<User, 'id' | 'email'>,
  ): GetMilestonesAdapterEventMother {
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
      .withUserClaims({ sub: this.user.id, email: this.user.email })
      .withPathParameters(this.pathParameters)
      .withQueryStringParameters(queryStringParameters)
      .build();
  }
}
