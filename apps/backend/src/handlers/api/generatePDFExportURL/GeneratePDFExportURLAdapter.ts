import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenGeneratePDFExportURLUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GeneratePDFExportURLPathSchema = z.object({
  assessmentId: z.uuid(),
  fileExportId: z.string().nonempty(),
}) satisfies ZodType<operations['generatePDFExportURL']['parameters']['path']>;

export class GeneratePDFExportURLAdapter {
  private readonly useCase = inject(tokenGeneratePDFExportURLUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['generatePDFExportURL']['responses']['200']['content']['application/json']
  > {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: GeneratePDFExportURLPathSchema,
    });

    const presignedURL = await this.useCase.generatePDFExportURL({
      ...pathParameters,
      user: getUserFromEvent(event),
    });
    return {
      url: presignedURL,
    };
  }
}
