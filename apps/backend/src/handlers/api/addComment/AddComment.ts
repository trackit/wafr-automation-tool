import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import {
  FindingNotFoundError,
  tokenAssessmentsRepository,
  tokenIdGenerator,
} from '@backend/infrastructure';
import { FindingComment } from '@backend/models';
import { NotFoundError } from '@backend/useCases';
import { parseJsonObject } from '@shared/utils';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const AddCommentPathSchema = z.object({
  assessmentId: z.string(),
  findingId: z.string(),
}) satisfies ZodType<operations['addComment']['parameters']['path']>;

const AddCommentArgsSchema = z.object({
  text: z.string(),
}) satisfies ZodType<
  operations['addComment']['requestBody']['content']['application/json']
>;

export class AddCommentAdapter {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly idGenerator = inject(tokenIdGenerator);

  private parseBody(
    body?: string
  ): operations['addComment']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return AddCommentArgsSchema.parse(parsedBody);
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

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['addComment']['responses'][200]['content']['application/json']
  > {
    const { pathParameters, body } = event;
    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    try {
      const user = getUserFromEvent(event);
      const parsedPath = AddCommentPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      const comment: FindingComment = {
        id: this.idGenerator.generate(),
        author: user.email,
        text: parsedBody.text,
        createdAt: new Date().toISOString(),
      };
      await this.assessmentsRepository
        .addFindingComment({
          assessmentId: parsedPath.assessmentId,
          organization: user.organizationDomain,
          findingId: decodeURIComponent(parsedPath.findingId),
          comment,
        })
        .catch((error) => {
          if (error instanceof FindingNotFoundError) {
            throw new NotFoundError(error.message);
          }
          throw error;
        });
      return comment;
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
