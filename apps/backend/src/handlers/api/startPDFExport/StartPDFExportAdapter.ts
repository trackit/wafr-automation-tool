import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenStartPDFExportUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { parseJsonObject } from '@shared/utils';
import {
  MissingRequestBodyError,
  MissingRequestPathError,
  RequestParsingFailedError,
} from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

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
      throw new MissingRequestPathError();
    }
    if (!body) {
      throw new MissingRequestBodyError();
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
        throw new RequestParsingFailedError(e);
      }
      throw e;
    }
  }
}
