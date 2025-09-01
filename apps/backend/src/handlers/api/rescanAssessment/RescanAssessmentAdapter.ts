import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenRescanAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

const RescanAssessmentArgsSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['rescanAssessment']['parameters']['path']>;

export class RescanAssessmentAdapter {
  private readonly useCase = inject(tokenRescanAssessmentUseCase);

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
  ): Promise<operations['rescanAssessment']['responses']['200']['content']> {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }

    try {
      const parsedParameters = RescanAssessmentArgsSchema.parse(pathParameters);
      await this.useCase.rescanAssessment({
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
