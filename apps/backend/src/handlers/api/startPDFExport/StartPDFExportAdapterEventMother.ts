import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type StartPDFExportParameters = operations['exportToPDF']['parameters']['path'];

type StartPDFExportBody =
  operations['exportToPDF']['requestBody']['content']['application/json'];

export class StartPDFExportAdapterEventMother {
  private pathParameters: StartPDFExportParameters;
  private body: StartPDFExportBody;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

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
        assessmentId: 'assessment-id',
      },
      {
        versionName: 'version-name',
      }
    );
  }

  public withAssessmentId(
    assessmentId: StartPDFExportParameters['assessmentId']
  ): StartPDFExportAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withVersionName(
    versionName: StartPDFExportBody['versionName']
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
