import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type ListPDFExportsParameters =
  operations['listPDFExports']['parameters']['path'];

export class ListPDFExportsAdapterEventMother {
  private pathParameters: ListPDFExportsParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(pathParameters: ListPDFExportsParameters) {
    this.pathParameters = pathParameters;
  }

  public static basic(): ListPDFExportsAdapterEventMother {
    return new ListPDFExportsAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): ListPDFExportsAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
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
