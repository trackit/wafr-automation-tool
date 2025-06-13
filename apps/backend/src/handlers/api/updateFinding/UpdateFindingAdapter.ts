import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenUpdateFindingUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { JSONParseError, parseJson } from '@shared/utils';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const updateFindingPathParametersSchema = z.object({
  assessmentId: z.string().uuid(),
  findingId: z
    .string()
    .regex(/.+#.+/, 'Invalid scanning tool finding ID format'),
}) satisfies ZodType<operations['updateFinding']['parameters']['path']>;

const updateFindingBodySchema = z.object({
  hidden: z.boolean().optional(),
}) satisfies ZodType<
  operations['updateFinding']['requestBody']['content']['application/json']
>;

export class UpdateFindingAdapter {
  private readonly useCase = inject(tokenUpdateFindingUseCase);

  private parseBody(
    body: string
  ): operations['updateFinding']['requestBody']['content']['application/json'] {
    const parsedBody = parseJson(body);
    return updateFindingBodySchema.parse(parsedBody);
  }

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<operations['updateFinding']['responses']['200']['content']> {
    const { pathParameters, body } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }
    if (!body) {
      throw new BadRequestError('Missing request body');
    }

    try {
      const { assessmentId, findingId } =
        updateFindingPathParametersSchema.parse(pathParameters);
      const findingBody = this.parseBody(body);
      await this.useCase.updateFinding({
        user: getUserFromEvent(event),
        assessmentId,
        findingId,
        findingBody,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(`Invalid path parameters: ${error.message}`);
      } else if (error instanceof JSONParseError) {
        throw new BadRequestError(
          `Invalid JSON in request body: ${error.message}`
        );
      }
      throw error;
    }
  }
}
