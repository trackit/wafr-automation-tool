import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type DeleteAssessmentParameters = NonNullable<
  operations['deleteAssessment']['parameters']['path']
>;

export class DeleteAssessmentAdapterEventMother {
  private pathParameters: DeleteAssessmentParameters;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(params: DeleteAssessmentParameters) {
    this.pathParameters = params;
  }

  public static basic(): DeleteAssessmentAdapterEventMother {
    return new DeleteAssessmentAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): DeleteAssessmentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): DeleteAssessmentAdapterEventMother {
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
