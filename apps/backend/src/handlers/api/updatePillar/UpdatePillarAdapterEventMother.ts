import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class UpdatePillarAdapterEventMother {
  private path: operations['updatePillar']['parameters']['path'];
  private body: operations['updatePillar']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    path: operations['updatePillar']['parameters']['path'],
    body: operations['updatePillar']['requestBody']['content']['application/json']
  ) {
    this.path = path;
    this.body = body;
  }

  public static basic(): UpdatePillarAdapterEventMother {
    return new UpdatePillarAdapterEventMother(
      {
        assessmentId: 'assessment-id',
        pillarId: '1',
      },
      {
        disabled: false,
      }
    );
  }

  public withAssessmentId(
    assessmentId: operations['updatePillar']['parameters']['path']['assessmentId']
  ): UpdatePillarAdapterEventMother {
    this.path.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(
    pillarId: operations['updatePillar']['parameters']['path']['pillarId']
  ): UpdatePillarAdapterEventMother {
    this.path.pillarId = pillarId;
    return this;
  }

  public withBody(
    body: operations['updatePillar']['requestBody']['content']['application/json']
  ): UpdatePillarAdapterEventMother {
    this.body = body;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.path)
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
