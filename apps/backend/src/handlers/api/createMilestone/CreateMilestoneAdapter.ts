import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenCreateMilestoneUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const CreateMilestonePathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['createMilestone']['parameters']['path']>;

const CreateMilestoneBodySchema = z.object({
  region: z.string().nonempty().optional(),
  name: z.string().nonempty(),
}) satisfies ZodType<
  operations['createMilestone']['requestBody']['content']['application/json']
>;

export class CreateMilestoneAdapter {
  private readonly useCase = inject(tokenCreateMilestoneUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: CreateMilestonePathSchema,
      bodySchema: CreateMilestoneBodySchema,
    });

    const user = getUserFromEvent(event);

    await this.useCase.createMilestone({
      ...pathParameters,
      ...body,
      user,
    });
  }
}
