import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenUpdateQuestionUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { JSONParseError, parseJson } from '@shared/utils';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const UpdateQuestionPathSchema = z.object({
  assessmentId: z.string().uuid(),
  pillarId: z.string(),
  questionId: z.string(),
}) satisfies ZodType<operations['updateQuestion']['parameters']['path']>;

const UpdateQuestionBodySchema = z.object({
  none: z.boolean().optional(),
  disabled: z.boolean().optional(),
}) satisfies ZodType<
  operations['updateQuestion']['requestBody']['content']['application/json']
>;

export class UpdateQuestionAdapter {
  private readonly useCase = inject(tokenUpdateQuestionUseCase);

  private parseBody(
    body?: string
  ): operations['updateQuestion']['requestBody']['content']['application/json'] {
    const parsedBody = parseJson(body);
    return UpdateQuestionBodySchema.parse(parsedBody);
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
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }
    if (!body) {
      throw new BadRequestError('Missing body parameters');
    }

    try {
      const parsedPath = UpdateQuestionPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      await this.useCase.updateQuestion({
        user: getUserFromEvent(event),
        assessmentId: parsedPath.assessmentId,
        pillarId: parsedPath.pillarId,
        questionId: parsedPath.questionId,
        questionBody: parsedBody,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid parameters: ${e.message}`);
      } else if (e instanceof JSONParseError) {
        throw new BadRequestError(`Invalid JSON in request body: ${e.message}`);
      }
      throw e;
    }
  }
}
