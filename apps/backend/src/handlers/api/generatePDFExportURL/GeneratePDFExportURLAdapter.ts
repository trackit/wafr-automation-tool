import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenGeneratePDFExportURLUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import {
  MissingRequestPathError,
  RequestParsingFailedError,
} from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const GeneratePDFExportURLPathSchema = z.object({
  assessmentId: z.string(),
  fileExportId: z.string(),
}) satisfies ZodType<operations['generatePDFExportURL']['parameters']['path']>;

export class GeneratePDFExportURLAdapter {
  private readonly useCase = inject(tokenGeneratePDFExportURLUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['generatePDFExportURL']['responses']['200']['content']['application/json']
  > {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new MissingRequestPathError();
    }

    try {
      const parsedPath = GeneratePDFExportURLPathSchema.parse(pathParameters);
      const presignedURL = await this.useCase.generatePDFExportURL({
        ...parsedPath,
        user: getUserFromEvent(event),
      });
      return {
        url: presignedURL,
      };
    } catch (e) {
      if (e instanceof ZodError) {
        throw new RequestParsingFailedError(e);
      }
      throw e;
    }
  }
}
