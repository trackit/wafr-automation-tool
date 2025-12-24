import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { type FindingComment, type User } from '@backend/models';
import { tokenAddCommentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const AddCommentPathSchema = z.object({
  assessmentId: z.uuid(),
  version: z.string().regex(/^\d+$/, 'version must be a number'),
  findingId: z.string().nonempty(),
}) satisfies ZodType<operations['addComment']['parameters']['path']>;

const AddCommentArgsSchema = z.object({
  text: z.string().nonempty(),
}) satisfies ZodType<
  operations['addComment']['requestBody']['content']['application/json']
>;

export class AddCommentAdapter {
  private readonly useCase = inject(tokenAddCommentUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private toAddCommentResponse(
    user: User,
    comment: FindingComment,
  ): operations['addComment']['responses'][200]['content']['application/json'] {
    return {
      ...comment,
      authorEmail: user.email,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['addComment']['responses'][200]['content']['application/json']
  > {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: AddCommentPathSchema,
      bodySchema: AddCommentArgsSchema,
    });

    const { assessmentId, findingId } = pathParameters;
    const user = getUserFromEvent(event);

    const comment = await this.useCase.addComment({
      assessmentId,
      findingId: decodeURIComponent(findingId),
      version: Number(pathParameters.version),
      text: body.text,
      user,
    });
    return this.toAddCommentResponse(user, comment);
  }
}
