import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenStartAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { JSONParseError, parseJsonObject } from '@shared/utils';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const StartAssessmentArgsSchema = z.object({
  name: z.string(),
  regions: z.array(z.string()).optional(),
  roleArn: z.string(),
  workflows: z.array(z.string()).optional(),
}) satisfies ZodType<
  operations['startAssessment']['requestBody']['content']['application/json']
>;

export class StartAssessmentAdapter {
  private readonly useCase = inject(tokenStartAssessmentUseCase);

  private parseBody(
    body?: string
  ): operations['startAssessment']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return StartAssessmentArgsSchema.parse(parsedBody);
  }

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 201,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['startAssessment']['responses'][201]['content']['application/json']
  > {
    const { body } = event;
    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    try {
      const parsedBody = this.parseBody(body);
      const { assessmentId } = await this.useCase.startAssessment({
        user: getUserFromEvent(event),
        ...parsedBody,
      });
      return { assessmentId };
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request body: ${e.message}`);
      } else if (e instanceof JSONParseError) {
        throw new BadRequestError(`Invalid JSON in request body: ${e.message}`);
      }
      throw e;
    }
  }
}
