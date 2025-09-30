import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenStartPDFExportUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const StartPDFExportPathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['startPDFExport']['parameters']['path']>;

const StartPDFExportBodySchema = z.object({
  versionName: z.string().nonempty(),
}) satisfies ZodType<
  operations['startPDFExport']['requestBody']['content']['application/json']
>;

export class StartPDFExportAdapter {
  private readonly useCase = inject(tokenStartPDFExportUseCase);

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
      pathSchema: StartPDFExportPathSchema,
      bodySchema: StartPDFExportBodySchema,
    });

    await this.useCase.startPDFExport({
      user: getUserFromEvent(event),
      ...pathParameters,
      ...body,
    });
  }
}
