import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { inject } from '@shared/di-container';
import { operations } from '@shared/api-schema';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { tokenGetMilestonesUseCase } from '@backend/useCases';

const GetMilestonesPathSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['getMilestones']['parameters']['path']>;

const GetMilestonesQuerySchema = z.object({
  region: z.string().optional(),
}) satisfies ZodType<operations['getMilestones']['parameters']['query']>;

export class GetMilestonesAdapter {
  private readonly useCase = inject(tokenGetMilestonesUseCase);

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
    operations['getMilestones']['responses']['200']['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = event;
    try {
      const { assessmentId } = GetMilestonesPathSchema.parse(pathParameters);
      const { region } = GetMilestonesQuerySchema.parse(queryStringParameters);

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
      }
      throw e;
    }
  }
}
