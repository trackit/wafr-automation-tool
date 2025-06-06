import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { tokenExportWellArchitectedToolUseCase } from '@backend/useCases';
import { BadRequestError } from '../../utils/HttpError';
import { getUserFromEvent } from '../../utils/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../utils/handleHttpRequest';

const ExportWellArchitectedToolPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<
  operations['exportWellArchitectedTool']['parameters']['path']
>;

export class ExportWellArchitectedToolAdapter {
  private readonly useCase = inject(tokenExportWellArchitectedToolUseCase);

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
    try {
      const parsedPath =
        ExportWellArchitectedToolPathSchema.parse(pathParameters);
      await this.useCase.exportAssessment({
        user: getUserFromEvent(event),
        ...parsedPath,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
