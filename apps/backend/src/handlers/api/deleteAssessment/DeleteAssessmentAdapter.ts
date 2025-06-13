import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenDeleteAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const DeleteAssessmentArgsSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['deleteAssessment']['parameters']['path']>;

export class DeleteAssessmentAdapter {
  private readonly useCase = inject(tokenDeleteAssessmentUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<operations['deleteAssessment']['responses']['200']['content']> {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }

    try {
      const parsedParameters = DeleteAssessmentArgsSchema.parse(pathParameters);
      await this.useCase.deleteAssessment({
        user: getUserFromEvent(event),
        ...parsedParameters,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(`Invalid path parameters: ${error.message}`);
      }
      throw error;
    }
  }
}
