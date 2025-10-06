import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentGraphParameters =
  operations['getAssessmentGraph']['parameters']['path'];

export class GetAssessmentGraphAdapterEventMother {
  private pathParameters: GetAssessmentGraphParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(params: GetAssessmentGraphParameters) {
    this.pathParameters = params;
  }

  public static basic(): GetAssessmentGraphAdapterEventMother {
    return new GetAssessmentGraphAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): GetAssessmentGraphAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetAssessmentGraphAdapterEventMother {
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
