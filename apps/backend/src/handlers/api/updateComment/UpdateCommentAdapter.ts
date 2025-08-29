import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenUpdateCommentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

const UpdateCommentPathSchema = z.object({
  assessmentId: z.string(),
  findingId: z.string(),
  commentId: z.string(),
}) satisfies ZodType<operations['updateComment']['parameters']['path']>;

const UpdateCommentArgsSchema = z.object({
  text: z.string(),
}) satisfies ZodType<
  operations['updateComment']['requestBody']['content']['application/json']
>;

export class UpdateCommentAdapter {
  private readonly useCase = inject(tokenUpdateCommentUseCase);

  private parseBody(
    body?: string
  ): operations['updateComment']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return UpdateCommentArgsSchema.parse(parsedBody);
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

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = event;
    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    try {
      const parsedPath = UpdateCommentPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);

      await this.useCase.updateComment({
        assessmentId: parsedPath.assessmentId,
        findingId: decodeURIComponent(parsedPath.findingId),
        commentId: parsedPath.commentId,
        user: getUserFromEvent(event),
        commentBody: parsedBody,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
