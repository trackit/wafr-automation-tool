import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { tokenCreateMilestoneUseCase } from '@backend/useCases';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseJsonObject } from '@shared/utils';

const CreateMilestonePathSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['createMilestone']['parameters']['path']>;

const CreateMilestoneBodySchema = z.object({
  region: z.string(),
  name: z.string(),
}) satisfies ZodType<
  operations['createMilestone']['requestBody']['content']['application/json']
>;

export class CreateMilestoneAdapter {
  private readonly useCase = inject(tokenCreateMilestoneUseCase);

  private parseBody(
    body?: string
  ): operations['createMilestone']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return CreateMilestoneBodySchema.parse(parsedBody);
  }

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = event;
    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    try {
      const parsedPath = CreateMilestonePathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      await this.useCase.createMilestone({
        user: getUserFromEvent(event),
        ...parsedPath,
        ...parsedBody,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
