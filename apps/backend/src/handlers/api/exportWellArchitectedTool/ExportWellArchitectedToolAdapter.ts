import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { tokenExportWellArchitectedToolUseCase } from '@backend/useCases';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseJsonObject } from '@shared/utils';

const ExportWellArchitectedToolPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<
  operations['exportWellArchitectedTool']['parameters']['path']
>;

const ExportWellArchitectedArgsSchema = z.object({
  region: z.string(),
}) satisfies ZodType<
  operations['exportWellArchitectedTool']['requestBody']['content']['application/json']
>;

export class ExportWellArchitectedToolAdapter {
  private readonly useCase = inject(tokenExportWellArchitectedToolUseCase);

  private parseBody(
    body?: string
  ): operations['exportWellArchitectedTool']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return ExportWellArchitectedArgsSchema.parse(parsedBody);
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
    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    try {
      const parsedPath =
        ExportWellArchitectedToolPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      await this.useCase.exportAssessment({
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
