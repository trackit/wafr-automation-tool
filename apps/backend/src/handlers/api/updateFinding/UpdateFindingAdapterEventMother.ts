import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdateFindingPathParameters =
  operations['updateFinding']['parameters']['path'];
type UpdateFindingBody =
  operations['updateFinding']['requestBody']['content']['application/json'];

export class UpdateFindingAdapterEventMother {
  private pathParameters: UpdateFindingPathParameters;
  private body: UpdateFindingBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: UpdateFindingPathParameters,
    body: UpdateFindingBody
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
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
    assessmentId: string
  ): UpdateFindingAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): UpdateFindingAdapterEventMother {
    this.pathParameters.findingId = findingId;
    return this;
  }

  public withHidden(hidden: boolean): UpdateFindingAdapterEventMother {
    this.body.hidden = hidden;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): UpdateFindingAdapterEventMother {
    this.user = user;
    return this;
  }

  public withBody(body: UpdateFindingBody): UpdateFindingAdapterEventMother {
    this.body = body;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withBody(JSON.stringify(this.body))
      .withPathParameters(this.pathParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
