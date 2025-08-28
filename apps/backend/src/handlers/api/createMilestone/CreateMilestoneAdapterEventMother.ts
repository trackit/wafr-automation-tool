import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type CreateMilestoneParameters = NonNullable<
  operations['createMilestone']['parameters']['path']
>;

type CreateMilestoneBody = NonNullable<
  operations['createMilestone']['requestBody']['content']['application/json']
>;

export class CreateMilestoneAdapterEventMother {
  private pathParameters: CreateMilestoneParameters;
  private body: CreateMilestoneBody;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    params: CreateMilestoneParameters,
    body: CreateMilestoneBody
  ) {
    this.pathParameters = params;
    this.body = body;
  }

  public static basic(): CreateMilestoneAdapterEventMother {
    return new CreateMilestoneAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {
        region: 'us-west-2',
        name: 'Milestone Name',
      }
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): CreateMilestoneAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): CreateMilestoneAdapterEventMother {
    this.user = user;
    return this;
  }

  public withRegion(region: string): CreateMilestoneAdapterEventMother {
    this.body.region = region;
    return this;
  }

  public withName(name: string): CreateMilestoneAdapterEventMother {
    this.body.name = name;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
