import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenUpdateFindingUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const UpdateFindingPathSchema = z.object({
  assessmentId: z.uuid(),
  findingId: z.string().nonempty(),
}) satisfies ZodType<operations['updateFinding']['parameters']['path']>;

const UpdateFindingBodySchema = z.object({
  hidden: z.boolean().optional(),
}) satisfies ZodType<
  operations['updateFinding']['requestBody']['content']['application/json']
>;

export class UpdateFindingAdapter {
  private readonly useCase = inject(tokenUpdateFindingUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<operations['updateFinding']['responses']['200']['content']> {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: UpdateFindingPathSchema,
      bodySchema: UpdateFindingBodySchema,
    });
    const { assessmentId, findingId } = pathParameters;

    const user = getUserFromEvent(event);

    await this.useCase.updateFinding({
      assessmentId,
      findingId: decodeURIComponent(findingId),
      findingBody: body,
      user,
    });
  }
}
