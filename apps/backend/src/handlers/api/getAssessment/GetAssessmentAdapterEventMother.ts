import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentParameters = NonNullable<
  operations['getAssessment']['parameters']['path']
>;

export class GetAssessmentAdapterEventMother {
  private pathParameters: GetAssessmentParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(params: GetAssessmentParameters) {
    this.pathParameters = params;
  }

  public static basic(): GetAssessmentAdapterEventMother {
    return new GetAssessmentAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetAssessmentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetAssessmentAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
