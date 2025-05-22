import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { tokenStartAssessmentUseCase } from '@backend/useCases';
import { JSONParseError, parseJson } from '@shared/utils';

import { BadRequestError, handleHttpRequest } from '../../handlers/HttpErrors';

const StartAssessmentArgsSchema = z.object({
  name: z.string(),
  regions: z.array(z.string()).optional(),
  roleArn: z.string().optional(),
  workflows: z.array(z.string()).optional(),
}) satisfies ZodType<
  operations['startAssessment']['requestBody']['content']['application/json']
>;

export class StartAssessmentAdapter {
  private readonly useCase = inject(tokenStartAssessmentUseCase);

  private parseBody(
    body?: string
  ): operations['startAssessment']['requestBody']['content']['application/json'] {
    const parsedBody = parseJson(body);
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
    event: APIGatewayProxyEvent,
    user: User
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
        ...parsedBody,
        user,
      });
      return { assessment_id: assessmentId };
    } catch (e) {
      if (e instanceof z.ZodError) {
        throw new BadRequestError(`Invalid request body: ${e.message}`);
      } else if (e instanceof JSONParseError) {
        throw new BadRequestError(`Invalid JSON in request body: ${e.message}`);
      }
      throw e;
    }
  }
}
