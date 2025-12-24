import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenDeleteCommentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const DeleteCommentPathSchema = z.object({
  assessmentId: z.uuid(),
  version: z.string().regex(/^\d+$/, 'version must be a number'),
  findingId: z.string().nonempty(),
  commentId: z.uuid(),
}) satisfies ZodType<operations['deleteComment']['parameters']['path']>;

export class DeleteCommentAdapter {
  private readonly useCase = inject(tokenDeleteCommentUseCase);

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
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: DeleteCommentPathSchema,
    });

    const { assessmentId, findingId, commentId } = pathParameters;

    const user = getUserFromEvent(event);

    await this.useCase.deleteComment({
      assessmentId,
      version: Number(pathParameters.version),
      findingId: decodeURIComponent(findingId),
      commentId,
      user,
    });
  }
}
