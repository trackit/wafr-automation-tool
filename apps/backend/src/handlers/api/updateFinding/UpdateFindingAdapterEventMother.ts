import { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class UpdateFindingAdapterEventMother {
  private pathParameters: operations['updateFinding']['parameters']['path'];
  private requestBody: operations['updateFinding']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    pathParameters: operations['updateFinding']['parameters']['path'],
    requestBody: operations['updateFinding']['requestBody']['content']['application/json']
  ) {
    this.pathParameters = pathParameters;
    this.requestBody = requestBody;
  }

  public static basic(): UpdateFindingAdapterEventMother {
    return new UpdateFindingAdapterEventMother(
      {
        assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
        findingId: 'scanning-tool#12345',
      },
      {
        hidden: false,
      }
    );
  }

  public withAssessmentId(
    assessmentId: operations['updateFinding']['parameters']['path']['assessmentId']
  ): UpdateFindingAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(
    findingId: operations['updateFinding']['parameters']['path']['findingId']
  ): UpdateFindingAdapterEventMother {
    this.pathParameters.findingId = findingId;
    return this;
  }

  public withHidden(
    hidden: operations['updateFinding']['requestBody']['content']['application/json']['hidden']
  ): UpdateFindingAdapterEventMother {
    this.requestBody.hidden = hidden;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): UpdateFindingAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withBody(JSON.stringify(this.requestBody))
      .withPathParameters(this.pathParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
