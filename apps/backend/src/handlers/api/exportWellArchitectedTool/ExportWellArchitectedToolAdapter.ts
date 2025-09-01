import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenExportWellArchitectedToolUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

const ExportWellArchitectedToolPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<
  operations['exportWellArchitectedTool']['parameters']['path']
>;

const ExportWellArchitectedArgsSchema = z.object({
  region: z.string().optional(),
}) satisfies ZodType<
  NonNullable<
    operations['exportWellArchitectedTool']['requestBody']
  >['content']['application/json']
>;

export class ExportWellArchitectedToolAdapter {
  private readonly useCase = inject(tokenExportWellArchitectedToolUseCase);

  private parseBody(
    body?: string
  ): NonNullable<
    operations['exportWellArchitectedTool']['requestBody']
  >['content']['application/json'] {
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
    try {
      const parsedPath =
        ExportWellArchitectedToolPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body ?? undefined);
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
