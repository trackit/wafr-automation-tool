import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { z } from 'zod';

import { inject } from '@shared/di-container';
import type { operations } from '@shared/api-schema';
import { tokenStartAssessmentUseCase } from '@backend/useCases';

import { BadRequestError, handleHttpRequest } from '../../handlers/HttpErrors';

const StartAssessmentArgsSchema = z.object({
  name: z.string(),
  regions: z.array(z.string()).optional(),
  roleArn: z.string().optional(),
  workflows: z.array(z.string()).optional(),
});

export class StartAssessmentAdapter {
  private readonly useCase = inject(tokenStartAssessmentUseCase);

  public async handle(
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResultV2> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 201,
    });
  }

  public async processRequest(
    event: APIGatewayProxyEventV2
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

    const { assessmentId } = await this.useCase.startAssessment(parsedBody);
    return { assessment_id: Number(assessmentId) }; // TODO: change return type to string ? (will also have to change front)
  }
}
