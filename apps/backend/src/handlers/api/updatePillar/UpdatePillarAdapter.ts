import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { tokenUpdatePillarUseCase } from '@backend/useCases';
import { JSONParseError, parseJson } from '@shared/utils';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const UpdatePillarPathSchema = z.object({
  assessmentId: z.string(),
  pillarId: z.string(),
}) satisfies ZodType<operations['updatePillar']['parameters']['path']>;

const UpdatePillarBodySchema = z
  .object({
    disabled: z.boolean().optional(),
  })
  .strict() satisfies ZodType<
  operations['updatePillar']['requestBody']['content']['application/json']
>;

export class UpdatePillarAdapter {
  private readonly useCase = inject(tokenUpdatePillarUseCase);

  private parseBody(
    body?: string
  ): operations['updatePillar']['requestBody']['content']['application/json'] {
    const parsedBody = parseJson(body);
    return UpdatePillarBodySchema.parse(parsedBody);
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
      const parsedPath = UpdatePillarPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body);
      await this.useCase.updatePillar({
        user: getUserFromEvent(event),
        assessmentId: parsedPath.assessmentId,
        pillarId: parsedPath.pillarId,
        pillarBody: parsedBody,
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
