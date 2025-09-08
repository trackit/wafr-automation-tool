import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class RescanAssessmentAdapterEventMother {
  private pathParameters: operations['rescanAssessment']['parameters']['path'];

  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    path: operations['rescanAssessment']['parameters']['path']
  ) {
    this.pathParameters = path;
  }

  public static basic(): RescanAssessmentAdapterEventMother {
    return new RescanAssessmentAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): RescanAssessmentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
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
