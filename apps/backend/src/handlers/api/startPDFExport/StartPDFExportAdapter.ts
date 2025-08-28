import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { tokenStartPDFExportUseCase } from '@backend/useCases';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseJsonObject } from '@shared/utils';

const StartPDFExportPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['exportToPDF']['parameters']['path']>;

const StartPDFExportBodySchema = z.object({
  versionName: z.string(),
}) satisfies ZodType<
  operations['exportToPDF']['requestBody']['content']['application/json']
>;

export class StartPDFExportAdapter {
  private readonly useCase = inject(tokenStartPDFExportUseCase);

  private parseBody(
    body: string
  ): operations['exportToPDF']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return StartPDFExportBodySchema.parse(parsedBody);
  }

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
    const { pathParameters, body } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }
    if (!body) {
      throw new BadRequestError('Missing request body');
    }

    try {
      const parsedPath = StartPDFExportPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      await this.useCase.startPDFExport({
        user: getUserFromEvent(event),
        ...parsedPath,
        ...parsedBody,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
