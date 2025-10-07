import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type RescanAssessmentPathParameters =
  operations['rescanAssessment']['parameters']['path'];

export class RescanAssessmentAdapterEventMother {
  private pathParameters: RescanAssessmentPathParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(pathParameters: RescanAssessmentPathParameters) {
    this.pathParameters = pathParameters;
  }

  public static basic(): RescanAssessmentAdapterEventMother {
    return new RescanAssessmentAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): RescanAssessmentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): RescanAssessmentAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withUserClaims({ sub: this.user.id, email: this.user.email })
      .withPathParameters(this.pathParameters)
      .build();
  }
}
