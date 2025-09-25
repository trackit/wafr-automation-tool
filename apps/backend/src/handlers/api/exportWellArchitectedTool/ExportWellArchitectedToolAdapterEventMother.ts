import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type ExportWellArchitectedToolParameters = NonNullable<
  operations['exportWellArchitectedTool']['parameters']['path']
>;

type ExportWellArchitectedToolBody = NonNullable<
  NonNullable<
    operations['exportWellArchitectedTool']['requestBody']
  >['content']['application/json']
>;

export class ExportWellArchitectedToolAdapterEventMother {
  private pathParameters: ExportWellArchitectedToolParameters;
  private body: ExportWellArchitectedToolBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    params: ExportWellArchitectedToolParameters,
    body: ExportWellArchitectedToolBody
  ) {
    this.pathParameters = params;
    this.body = body;
  }

  public static basic(): ExportWellArchitectedToolAdapterEventMother {
    return new ExportWellArchitectedToolAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {
        region: 'us-west-2',
      }
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): ExportWellArchitectedToolAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): ExportWellArchitectedToolAdapterEventMother {
    this.user = user;
    return this;
  }

  public withRegion(
    region?: string
  ): ExportWellArchitectedToolAdapterEventMother {
    this.body.region = region;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
