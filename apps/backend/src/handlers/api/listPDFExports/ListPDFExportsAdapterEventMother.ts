import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type ListPDFExportsParameters = NonNullable<
  operations['listPDFExports']['parameters']['path']
>;

export class ListPDFExportsAdapterEventMother {
  private pathParameters: ListPDFExportsParameters;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(pathParameters: ListPDFExportsParameters) {
    this.pathParameters = pathParameters;
  }

  public static basic(): ListPDFExportsAdapterEventMother {
    return new ListPDFExportsAdapterEventMother({
      assessmentId: 'assessment-id',
    });
  }

  public withAssessmentId(
    assessmentId: ListPDFExportsParameters['assessmentId']
  ): ListPDFExportsAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): ListPDFExportsAdapterEventMother {
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
