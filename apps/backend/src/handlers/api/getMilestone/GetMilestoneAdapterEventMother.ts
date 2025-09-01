import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class GetMilestoneAdapterEventMother {
  private pathParameters: operations['getMilestone']['parameters']['path'];
  private queryStringParameters: NonNullable<
    operations['getMilestone']['parameters']['query']
  >;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    pathParameters: operations['getMilestone']['parameters']['path'],
    queryStringParameters: NonNullable<
      operations['getMilestone']['parameters']['query']
    >
  ) {
    this.pathParameters = pathParameters;
    this.queryStringParameters = queryStringParameters;
  }

  public static basic(): GetMilestoneAdapterEventMother {
    return new GetMilestoneAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        milestoneId: '1',
      },
      {}
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): GetMilestoneAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withMilestoneId(
    milestoneId: string | number
  ): GetMilestoneAdapterEventMother {
    this.pathParameters.milestoneId = milestoneId.toString();
    return this;
  }

  public withOrganization(
    organization: string
  ): GetMilestoneAdapterEventMother {
    this.user.email = `${this.user.id}@${organization}`;
    return this;
  }

  public withRegion(region?: string): GetMilestoneAdapterEventMother {
    this.queryStringParameters.region = region;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetMilestoneAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const queryStringParameters = Object.fromEntries(
      Object.entries(this.queryStringParameters).map(([key, value]) => [
        key,
        value === undefined ? undefined : String(value),
      ])
    );
    return APIGatewayProxyEventMother.basic()
      .withUserClaims({ sub: this.user.id, email: this.user.email })
      .withPathParameters(this.pathParameters)
      .withQueryStringParameters(queryStringParameters)
      .build();
  }
}
