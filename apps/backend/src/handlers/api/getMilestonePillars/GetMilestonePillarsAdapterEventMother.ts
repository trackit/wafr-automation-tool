import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { operations } from '@shared/api-schema';

export class GetMilestonePillarsAdapterEventMother {
  private pathParameters: operations['getMilestonePillars']['parameters']['path'];
  private body: operations['getMilestonePillars']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    pathParameters: operations['getMilestonePillars']['parameters']['path'],
    body: operations['getMilestonePillars']['requestBody']['content']['application/json']
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): GetMilestonePillarsAdapterEventMother {
    return new GetMilestonePillarsAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        milestoneId: '1',
      },
      {
        region: 'us-west-2',
      }
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

  public withRegion(region: string): GetMilestonePillarsAdapterEventMother {
    this.body.region = region;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetMilestonePillarsAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withUserClaims({ sub: this.user.id, email: this.user.email })
      .withPathParameters(this.pathParameters)
      .withBody(JSON.stringify(this.body))
      .build();
  }
}
