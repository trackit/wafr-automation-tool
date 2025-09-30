import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GeneratePDFExportURLParameters =
  operations['generatePDFExportURL']['parameters']['path'];

export class GeneratePDFExportURLAdapterEventMother {
  private pathParameters: GeneratePDFExportURLParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(pathParameters: GeneratePDFExportURLParameters) {
    this.pathParameters = pathParameters;
  }

  public static basic(): GeneratePDFExportURLAdapterEventMother {
    return new GeneratePDFExportURLAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      fileExportId: 'file-export-id',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): GeneratePDFExportURLAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFileExportId(
    fileExportId: string,
  ): GeneratePDFExportURLAdapterEventMother {
    this.pathParameters.fileExportId = fileExportId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): GeneratePDFExportURLAdapterEventMother {
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
