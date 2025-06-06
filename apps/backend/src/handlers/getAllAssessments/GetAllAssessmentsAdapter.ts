import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenGetAllAssessmentsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { BadRequestError } from '../../utils/HttpError';
import { getUserFromEvent } from '../../utils/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../utils/handleHttpRequest';

const GetAllAssessmentsQuerySchema = z.object({
  limit: z.coerce.number().min(0, "Limit can't be negative").optional(),
  search: z.string().optional(),
  next_token: z.string().optional(),
}) satisfies ZodType<operations['getAssessments']['parameters']['query']>;

export class GetAllAssessmentsAdapter {
  private readonly useCase = inject(tokenGetAllAssessmentsUseCase);

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
    operations['getAssessments']['responses'][200]['content']['application/json']
  > {
    const { queryStringParameters } = event;
    try {
      const parsedQuery = GetAllAssessmentsQuerySchema.parse(
        queryStringParameters
      );
      const { assessments, nextToken } = await this.useCase.getAllAssessments({
        user: getUserFromEvent(event),
        ...parsedQuery,
      });
      return { assessments: assessments, next_token: nextToken };
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
