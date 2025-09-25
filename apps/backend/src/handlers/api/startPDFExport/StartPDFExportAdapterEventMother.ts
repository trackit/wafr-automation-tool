import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type StartPDFExportParameters =
  operations['startPDFExport']['parameters']['path'];

type StartPDFExportBody =
  operations['startPDFExport']['requestBody']['content']['application/json'];

export class StartPDFExportAdapterEventMother {
  private pathParameters: StartPDFExportParameters;
  private body: StartPDFExportBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: StartPDFExportParameters,
    body: StartPDFExportBody
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): StartPDFExportAdapterEventMother {
    return new StartPDFExportAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {
        versionName: 'version-name',
      }
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): StartPDFExportAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withVersionName(
    versionName: string
  ): StartPDFExportAdapterEventMother {
    this.body.versionName = versionName;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): StartPDFExportAdapterEventMother {
    this.user = user;
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
