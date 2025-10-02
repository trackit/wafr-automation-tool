import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdateAssessmentPathParameters =
  operations['updateAssessment']['parameters']['path'];
type UpdateAssessmentBody =
  operations['updateAssessment']['requestBody']['content']['application/json'];

export class UpdateAssessmentAdapterEventMother {
  private pathParameters: UpdateAssessmentPathParameters;
  private body: UpdateAssessmentBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: UpdateAssessmentPathParameters,
    body: UpdateAssessmentBody,
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): UpdateAssessmentAdapterEventMother {
    return new UpdateAssessmentAdapterEventMother(
      {
        assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      },
      {
        name: 'Updated Assessment Name',
      },
    );
  }

  public withAssessmentId(
    assessmentId: string,
  ): UpdateAssessmentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withName(name: string): UpdateAssessmentAdapterEventMother {
    this.body.name = name;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): UpdateAssessmentAdapterEventMother {
    this.user = user;
    return this;
  }

  public withBody(
    body: UpdateAssessmentBody,
  ): UpdateAssessmentAdapterEventMother {
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
