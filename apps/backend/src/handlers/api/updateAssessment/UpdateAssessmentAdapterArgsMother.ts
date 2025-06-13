import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEvent } from 'aws-lambda';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class UpdateAssessmentAdapterArgsMother {
  private assessmentId: operations['updateAssessment']['parameters']['path']['assessmentId'];
  private requestBody: operations['updateAssessment']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(assessmentId: string, requestBody: Record<string, any>) {
    this.assessmentId = assessmentId;
    this.requestBody = requestBody;
  }

  public static basic(): UpdateAssessmentAdapterArgsMother {
    return new UpdateAssessmentAdapterArgsMother(
      '14270881-e4b0-4f89-8941-449eed22071d',
      {
        name: 'Updated Assessment',
      }
    );
  }

  public withAssessmentId(
    assessmentId: operations['updateAssessment']['parameters']['path']['assessmentId']
  ): UpdateAssessmentAdapterArgsMother {
    this.assessmentId = assessmentId;
    return this;
  }

  public withName(
    name: operations['updateAssessment']['requestBody']['content']['application/json']['name']
  ): UpdateAssessmentAdapterArgsMother {
    this.requestBody.name = name;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): UpdateAssessmentAdapterArgsMother {
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
