import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenDeletePDFExportUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const DeletePDFExportPathSchema = z.object({
  assessmentId: z.uuid(),
  fileExportId: z.string().nonempty(),
}) satisfies ZodType<operations['listPDFExports']['parameters']['path']>;

export class DeletePDFExportAdapter {
  private readonly useCase = inject(tokenDeletePDFExportUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: DeletePDFExportPathSchema,
    });

    await this.useCase.deletePDFExport({
      ...pathParameters,
      user: getUserFromEvent(event),
    });
  }
}
