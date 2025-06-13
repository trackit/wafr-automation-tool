import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type ExportWellArchitectedToolParameters = NonNullable<
  operations['exportWellArchitectedTool']['parameters']['path']
>;

export class ExportWellArchitectedToolAdapterEventMother {
  private data: ExportWellArchitectedToolParameters;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(data: ExportWellArchitectedToolParameters) {
    this.data = data;
  }

  public static basic(): ExportWellArchitectedToolAdapterEventMother {
    return new ExportWellArchitectedToolAdapterEventMother({
      assessmentId: 'assessment-id',
    });
  }

  public withAssessmentId(
    assessmentId: ExportWellArchitectedToolParameters['assessmentId']
  ): ExportWellArchitectedToolAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): ExportWellArchitectedToolAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.data)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
