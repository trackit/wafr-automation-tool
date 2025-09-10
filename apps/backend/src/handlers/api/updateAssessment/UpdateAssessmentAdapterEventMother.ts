import { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class UpdateAssessmentAdapterEventMother {
  private assessmentId: operations['updateAssessment']['parameters']['path']['assessmentId'];
  private requestBody: operations['updateAssessment']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(assessmentId: string, requestBody: Record<string, any>) {
    this.assessmentId = assessmentId;
    this.requestBody = requestBody;
  }

  public static basic(): UpdateAssessmentAdapterEventMother {
    return new UpdateAssessmentAdapterEventMother(
      '14270881-e4b0-4f89-8941-449eed22071d',
      {
        name: 'Updated Assessment',
      }
    );
  }

  public withAssessmentId(
    assessmentId: operations['updateAssessment']['parameters']['path']['assessmentId']
  ): UpdateAssessmentAdapterEventMother {
    this.assessmentId = assessmentId;
    return this;
  }

  public withName(
    name: operations['updateAssessment']['requestBody']['content']['application/json']['name']
  ): UpdateAssessmentAdapterEventMother {
    this.requestBody.name = name;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): UpdateAssessmentAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withBody(JSON.stringify(this.requestBody))
      .withPathParameters({ assessmentId: this.assessmentId })
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
