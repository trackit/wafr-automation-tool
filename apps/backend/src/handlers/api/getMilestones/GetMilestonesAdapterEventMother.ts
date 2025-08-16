import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { operations } from '@shared/api-schema';

export class GetMilestonesAdapterEventMother {
  private pathParameters: operations['getMilestones']['parameters']['path'];
  private body: operations['getMilestones']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    path: operations['getMilestones']['parameters']['path'],
    body: operations['getMilestones']['requestBody']['content']['application/json']
  ) {
    this.pathParameters = path;
    this.body = body;
  }

  public static basic(): GetMilestonesAdapterEventMother {
    return new GetMilestonesAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {
        region: 'us-west-2',
      }
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

  public withRegion(region: string): GetMilestonesAdapterEventMother {
    this.body.region = region;
    return this;
  }

  public withUser(user: Pick<User, 'id' | 'email'>): GetMilestonesAdapterEventMother {
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
