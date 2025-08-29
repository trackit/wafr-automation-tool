import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type DeletePDFExportParameters =
  operations['deletePDFExport']['parameters']['path'];

export class DeletePDFExportAdapterEventMother {
  private pathParameters: DeletePDFExportParameters;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(pathParameters: DeletePDFExportParameters) {
    this.pathParameters = pathParameters;
  }

  public static basic(): DeletePDFExportAdapterEventMother {
    return new DeletePDFExportAdapterEventMother({
      assessmentId: 'assessment-id',
      fileExportId: 'file-export-id',
    });
  }

  public withAssessmentId(
    assessmentId: DeletePDFExportParameters['assessmentId']
  ): DeletePDFExportAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFileExportId(
    fileExportId: DeletePDFExportParameters['fileExportId']
  ): DeletePDFExportAdapterEventMother {
    this.pathParameters.fileExportId = fileExportId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): DeletePDFExportAdapterEventMother {
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
