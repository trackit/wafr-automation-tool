import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenGetAssessmentStepUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

const GetAssessmentStepArgsSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['getAssessmentStep']['parameters']['path']>;

export class GetAssessmentStepAdapter {
  private readonly useCase = inject(tokenGetAssessmentStepUseCase);

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
    operations['getAssessmentStep']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }

    try {
      const { assessmentId } =
        GetAssessmentStepArgsSchema.parse(pathParameters);
      return {
        step: await this.useCase.getAssessmentStep({
          assessmentId,
          user: getUserFromEvent(event),
        }),
      };
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid path parameters: ${e.message}`);
      }
      throw e;
    }
  }
}
