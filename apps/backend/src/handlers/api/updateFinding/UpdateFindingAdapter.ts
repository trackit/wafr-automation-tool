import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType, ZodTypeDef } from 'zod';

import { tokenUpdateFindingUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { JSONParseError, parseJsonObject } from '@shared/utils';

import { FindingComment } from '@backend/models';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

type UpdateFindingBodyIn =
  operations['updateFinding']['requestBody']['content']['application/json'];

type UpdateFindingBodyOut = Omit<UpdateFindingBodyIn, 'comments'> & {
  comments?: FindingComment[];
};

const updateFindingPathParametersSchema = z.object({
  assessmentId: z.string().uuid(),
  findingId: z.string(),
}) satisfies ZodType<operations['updateFinding']['parameters']['path']>;

const updateFindingBodySchema = z.object({
  hidden: z.boolean().optional(),
  comments: z
    .array(
      z
        .object({
          id: z.string(),
          authorId: z.string(),
          authorName: z.string(),
          text: z.string(),
          createdAt: z.string().pipe(z.coerce.date()),
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .transform(({ authorName, ...rest }) => rest)
    )
    .optional(),
}) satisfies ZodType<UpdateFindingBodyOut, ZodTypeDef, UpdateFindingBodyIn>;

export class UpdateFindingAdapter {
  private readonly useCase = inject(tokenUpdateFindingUseCase);

  private parseBody(body: string): UpdateFindingBodyOut {
    const parsedBody = parseJsonObject(body);
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
        findingId: decodeURIComponent(findingId),
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
