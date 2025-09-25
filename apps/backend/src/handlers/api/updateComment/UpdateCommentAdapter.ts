import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenUpdateCommentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const UpdateCommentPathSchema = z.object({
  assessmentId: z.string().uuid(),
  findingId: z.string().nonempty(),
  commentId: z.string().uuid(),
}) satisfies ZodType<operations['updateComment']['parameters']['path']>;

const UpdateCommentBodySchema = z.object({
  text: z.string().nonempty(),
}) satisfies ZodType<
  operations['updateComment']['requestBody']['content']['application/json']
>;

export class UpdateCommentAdapter {
  private readonly useCase = inject(tokenUpdateCommentUseCase);

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
      pathSchema: UpdateCommentPathSchema,
      bodySchema: UpdateCommentBodySchema,
    });
    const { assessmentId, findingId, commentId } = pathParameters;

    const user = getUserFromEvent(event);

    await this.useCase.updateComment({
      assessmentId,
      findingId: decodeURIComponent(findingId),
      commentId,
      user,
      commentBody: body,
    });
  }
}
