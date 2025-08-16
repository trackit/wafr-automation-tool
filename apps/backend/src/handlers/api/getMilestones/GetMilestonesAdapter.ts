import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { inject } from '@shared/di-container';
import { operations } from '@shared/api-schema';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { JSONParseError, parseJsonObject } from '@shared/utils';
import { tokenGetMilestonesUseCase } from '@backend/useCases';

const GetMilestonesPathSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['getMilestones']['parameters']['path']>;

const GetMilestonesBodySchema = z.object({
  region: z.string(),
}) satisfies ZodType<
  operations['getMilestones']['requestBody']['content']['application/json']
>;

export class GetMilestonesAdapter {
  private readonly useCase = inject(tokenGetMilestonesUseCase);

  private parseBody(
    body?: string
  ): operations['getMilestones']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return GetMilestonesBodySchema.parse(parsedBody);
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
    operations['getMilestones']['responses']['200']['content']['application/json']['items']
  > {
    const { pathParameters, body } = event;

    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    try {
      const { assessmentId } = GetMilestonesPathSchema.parse(pathParameters);
      const { region } = this.parseBody(body);

      const user = getUserFromEvent(event);
      const milestones = await this.useCase.getMilestones({
        organizationDomain: user.organizationDomain,
        assessmentId,
        region,
      });
      return milestones.map((milestone) => ({
        ...milestone,
        createdAt: milestone.createdAt.toISOString(),
      }));
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request parameters: ${e.message}`);
      } else if (e instanceof JSONParseError) {
        throw new BadRequestError(`Invalid JSON in request body: ${e.message}`);
      }
      throw e;
    }
  }
}
