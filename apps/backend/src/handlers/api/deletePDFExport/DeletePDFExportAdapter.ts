import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenDeletePDFExportUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import {
  MissingRequestPathError,
  RequestParsingFailedError,
} from '../../../utils/api/HttpError';

const DeletePDFExportPathSchema = z.object({
  assessmentId: z.string(),
  fileExportId: z.string(),
}) satisfies ZodType<operations['listPDFExports']['parameters']['path']>;

export class DeletePDFExportAdapter {
  private readonly useCase = inject(tokenDeletePDFExportUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new MissingRequestPathError();
    }

    try {
      const parsedPath = DeletePDFExportPathSchema.parse(pathParameters);
      await this.useCase.deletePDFExport({
        ...parsedPath,
        user: getUserFromEvent(event),
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new RequestParsingFailedError(e);
      }
      throw e;
    }
  }
}
