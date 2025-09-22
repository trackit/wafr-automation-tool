import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenGetMilestonesUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetMilestonesPathSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['getMilestones']['parameters']['path']>;

const GetMilestonesQuerySchema = z.object({
  region: z.string().nonempty().optional(),
  limit: z.coerce.number().min(1, 'Limit must be greater than 0').optional(),
  nextToken: z.string().trim().nonempty().base64().optional(),
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
    const { pathParameters, queryStringParameters } = parseApiEvent(event, {
      pathSchema: GetMilestonesPathSchema,
      querySchema: GetMilestonesQuerySchema,
    });
    const { assessmentId } = pathParameters;
    const { region, limit, nextToken } = queryStringParameters;

    const user = getUserFromEvent(event);
    const { milestones, nextToken: responseNextToken } =
      await this.useCase.getMilestones({
        organizationDomain: user.organizationDomain,
        assessmentId,
        region,
        limit,
        nextToken,
      });
    return {
      milestones: milestones.map((milestone) => ({
        ...milestone,
        createdAt: milestone.createdAt.toISOString(),
      })),
      nextToken: responseNextToken,
    };
  }
}
