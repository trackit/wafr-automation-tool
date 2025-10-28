import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdatePillarPathParameters =
  operations['updatePillar']['parameters']['path'];
type UpdatePillarBody =
  operations['updatePillar']['requestBody']['content']['application/json'];

export class UpdatePillarAdapterEventMother {
  private pathParameters: UpdatePillarPathParameters;
  private body: UpdatePillarBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: UpdatePillarPathParameters,
    body: UpdatePillarBody,
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): UpdatePillarAdapterEventMother {
    return new UpdatePillarAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        pillarId: '1',
      },
      {
        disabled: false,
      },
    );
  }

  public withAssessmentId(
    assessmentId: string,
  ): UpdatePillarAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(pillarId: string): UpdatePillarAdapterEventMother {
    this.pathParameters.pillarId = pillarId;
    return this;
  }

  public withBody(body: UpdatePillarBody): UpdatePillarAdapterEventMother {
    this.body = body;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): UpdatePillarAdapterEventMother {
    this.user = user;
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
