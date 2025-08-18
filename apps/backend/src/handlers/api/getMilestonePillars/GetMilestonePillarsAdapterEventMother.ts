import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { operations } from '@shared/api-schema';

export class GetMilestonePillarsAdapterEventMother {
  private pathParameters: operations['getMilestonePillars']['parameters']['path'];
  private queryStringParameters: NonNullable<
    operations['getMilestonePillars']['parameters']['query']
  >;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    pathParameters: operations['getMilestonePillars']['parameters']['path'],
    queryStringParameters: NonNullable<
      operations['getMilestonePillars']['parameters']['query']
    >
  ) {
    this.pathParameters = pathParameters;
    this.queryStringParameters = queryStringParameters;
  }

  public static basic(): GetMilestonePillarsAdapterEventMother {
    return new GetMilestonePillarsAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        milestoneId: '1',
      },
      {}
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): GetMilestonePillarsAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withMilestoneId(
    milestoneId: string | number
  ): GetMilestonePillarsAdapterEventMother {
    this.pathParameters.milestoneId = milestoneId.toString();
    return this;
  }

  public withOrganization(
    organization: string
  ): GetMilestonePillarsAdapterEventMother {
    this.user.email = `${this.user.id}@${organization}`;
    return this;
  }

  public withRegion(region?: string): GetMilestonePillarsAdapterEventMother {
    this.queryStringParameters.region = region;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetMilestonePillarsAdapterEventMother {
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
