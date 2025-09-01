import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import {
  FindingNotFoundError,
  tokenAssessmentsRepository,
  tokenIdGenerator,
  tokenLogger,
} from '@backend/infrastructure';
import { FindingComment, User } from '@backend/models';
import { NotFoundError } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

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
  private readonly logger = inject(tokenLogger);

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

  private toAddCommentResponse(
    user: User,
    comment: FindingComment
  ): operations['addComment']['responses'][200]['content']['application/json'] {
    return {
      id: comment.id,
      authorId: comment.authorId,
      authorEmail: user.email,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    };
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
      const assessmentId = parsedPath.assessmentId;
      const findingId = decodeURIComponent(parsedPath.findingId);
      const comment: FindingComment = {
        id: this.idGenerator.generate(),
        authorId: user.id,
        text: parsedBody.text,
        createdAt: new Date(),
      };
      const finding = await this.assessmentsRepository.getFinding({
        assessmentId,
        organization: user.organizationDomain,
        findingId,
      });
      if (!finding) {
        this.logger.error(
          `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${user.organizationDomain}`
        );
        throw new NotFoundError(
          `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${user.organizationDomain}`
        );
      }
      await this.assessmentsRepository
        .addFindingComment({
          assessmentId,
          organization: user.organizationDomain,
          findingId,
          comment,
        })
        .catch((error) => {
          if (error instanceof FindingNotFoundError) {
            throw new NotFoundError(error.message);
          }
          throw error;
        });
      return this.toAddCommentResponse(user, comment);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
