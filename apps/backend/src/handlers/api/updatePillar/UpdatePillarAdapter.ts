import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenUpdatePillarUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const UpdatePillarPathSchema = z.object({
  assessmentId: z.uuid(),
  pillarId: z.string().nonempty(),
}) satisfies ZodType<operations['updatePillar']['parameters']['path']>;

const UpdatePillarBodySchema = z
  .object({
    disabled: z.boolean().optional(),
  })
  .strict() satisfies ZodType<
  operations['updatePillar']['requestBody']['content']['application/json']
>;

export class UpdatePillarAdapter {
  private readonly useCase = inject(tokenUpdatePillarUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: UpdatePillarPathSchema,
      bodySchema: UpdatePillarBodySchema,
    });
    const { assessmentId, pillarId } = pathParameters;

    const user = getUserFromEvent(event);

    await this.useCase.updatePillar({
      assessmentId,
      pillarId,
      user,
      pillarBody: body,
    });
  }
}
