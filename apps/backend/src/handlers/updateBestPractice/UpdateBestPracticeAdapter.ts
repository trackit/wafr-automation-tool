import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenUpdateBestPracticeUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { JSONParseError, parseJson } from '@shared/utils';
import { BadRequestError } from '../../utils/HttpError';
import { getUserFromEvent } from '../../utils/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../utils/handleHttpRequest';

const UpdateBestPracticePathSchema = z.object({
  assessmentId: z.string(),
  pillarId: z.string(),
  questionId: z.string(),
  bestPracticeId: z.string(),
}) satisfies ZodType<operations['updateBestPractice']['parameters']['path']>;

const UpdateBestPracticeBodySchema = z
  .object({
    checked: z.boolean().optional(),
  })
  .strict() satisfies ZodType<
  operations['updateBestPractice']['requestBody']['content']['application/json']
>;

export class UpdateBestPracticeAdapter {
  private readonly useCase = inject(tokenUpdateBestPracticeUseCase);

  private parseBody(
    body?: string
  ): operations['updateBestPractice']['requestBody']['content']['application/json'] {
    const parsedBody = parseJson(body);
    return UpdateBestPracticeBodySchema.parse(parsedBody);
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
      const parsedPath = UpdateBestPracticePathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      await this.useCase.updateBestPractice({
        user: getUserFromEvent(event),
        assessmentId: parsedPath.assessmentId,
        pillarId: parsedPath.pillarId,
        questionId: parsedPath.questionId,
        bestPracticeId: parsedPath.bestPracticeId,
        bestPracticeBody: parsedBody,
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
