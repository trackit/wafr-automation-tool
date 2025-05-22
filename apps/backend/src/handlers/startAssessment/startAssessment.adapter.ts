import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';

import type { User } from '@backend/models';
import { tokenStartAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { BadRequestError, handleHttpRequest } from '../../handlers/HttpErrors';

const StartAssessmentArgsSchema = z.object({
  name: z.string(),
  regions: z.array(z.string()).optional(),
  roleArn: z.string(),
  workflows: z.array(z.string()).optional(),
});

export class StartAssessmentAdapter {
  private readonly useCase = inject(tokenStartAssessmentUseCase);

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

    let jsonParsedBody: unknown;
    try {
      jsonParsedBody = JSON.parse(body);
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    let parsedBody: operations['startAssessment']['requestBody']['content']['application/json'];
    try {
      parsedBody = StartAssessmentArgsSchema.parse(jsonParsedBody);
    } catch {
      throw new BadRequestError('Invalid request body');
    }

    const { assessmentId } = await this.useCase.startAssessment({
      ...parsedBody,
      user,
    });
    return { assessment_id: assessmentId };
  }
}
