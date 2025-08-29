import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenListPDFExportsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { AssessmentFileExport } from '@backend/models';
import {
  MissingRequestPathError,
  RequestParsingFailedError,
} from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const ListPDFExportsPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['listPDFExports']['parameters']['path']>;

export class ListPDFExportsAdapter {
  private readonly useCase = inject(tokenListPDFExportsUseCase);

  private toAPIResponse(
    assessmentFileExports: AssessmentFileExport[]
  ): operations['listPDFExports']['responses'][200]['content']['application/json'] {
    return assessmentFileExports.map(
      ({ objectKey, ...assessmentFileExport }) => ({
        ...assessmentFileExport,
        createdAt: assessmentFileExport.createdAt.toISOString(),
      })
    );
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

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['listPDFExports']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new MissingRequestPathError();
    }

    try {
      const parsedPath = ListPDFExportsPathSchema.parse(pathParameters);
      const pdfExports = await this.useCase.listPDFExports({
        user: getUserFromEvent(event),
        assessmentId: parsedPath.assessmentId,
      });
      return this.toAPIResponse(pdfExports);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new RequestParsingFailedError(e);
      }
      throw e;
    }
  }
}
