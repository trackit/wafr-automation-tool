import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenExportWellArchitectedToolUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const ExportWellArchitectedToolPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<
  operations['exportWellArchitectedTool']['parameters']['path']
>;

const ExportWellArchitectedToolBodySchema = z.object({
  region: z.string().optional(),
}) satisfies ZodType<
  NonNullable<
    operations['exportWellArchitectedTool']['requestBody']
  >['content']['application/json']
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
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: ExportWellArchitectedToolPathSchema,
      bodySchema: ExportWellArchitectedToolBodySchema,
    });

    await this.useCase.exportAssessment({
      user: getUserFromEvent(event),
      ...pathParameters,
      ...body,
    });
  }
}
