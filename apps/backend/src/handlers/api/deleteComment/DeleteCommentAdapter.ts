import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenDeleteCommentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

const DeleteCommentPathSchema = z.object({
  assessmentId: z.string(),
  findingId: z.string(),
  commentId: z.string(),
}) satisfies ZodType<operations['deleteComment']['parameters']['path']>;

export class DeleteCommentAdapter {
  private readonly useCase = inject(tokenDeleteCommentUseCase);

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
    const { pathParameters } = event;

    try {
      const parsedPath = DeleteCommentPathSchema.parse(pathParameters);

      await this.useCase.deleteComment({
        assessmentId: parsedPath.assessmentId,
        findingId: decodeURIComponent(parsedPath.findingId),
        commentId: parsedPath.commentId,
        user: getUserFromEvent(event),
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
