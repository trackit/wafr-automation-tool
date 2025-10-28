import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { AssessmentFileExport } from '@backend/models';
import { tokenListPDFExportsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const ListPDFExportsPathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['listPDFExports']['parameters']['path']>;

export class ListPDFExportsAdapter {
  private readonly useCase = inject(tokenListPDFExportsUseCase);

  private toAPIResponse(
    assessmentFileExports: AssessmentFileExport[],
  ): operations['listPDFExports']['responses'][200]['content']['application/json'] {
    return assessmentFileExports.map(
      ({ objectKey: _, ...assessmentFileExport }) => ({
        ...assessmentFileExport,
        createdAt: assessmentFileExport.createdAt.toISOString(),
      }),
    );
  }

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
    operations['listPDFExports']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: ListPDFExportsPathSchema,
    });

    const { assessmentId } = pathParameters;

    const user = getUserFromEvent(event);

    const pdfExports = await this.useCase.listPDFExports({
      user,
      assessmentId,
    });
    return this.toAPIResponse(pdfExports);
  }
}
