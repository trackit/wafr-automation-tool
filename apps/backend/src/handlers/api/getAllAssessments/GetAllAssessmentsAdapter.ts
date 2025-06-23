import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenGetAllAssessmentsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { Assessment } from '@backend/models';
import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const GetAllAssessmentsQuerySchema = z
  .object({
    limit: z.coerce.number().min(1, 'Limit must be greater than 0').optional(),
    search: z.string().optional(),
    next_token: z.string().trim().base64().optional(),
  })
  .strict() satisfies ZodType<
  operations['getAssessments']['parameters']['query']
>;

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

  public convertToAPIAssessment(
    assessment: Assessment[]
  ): operations['getAssessments']['responses'][200]['content']['application/json']['assessments'] {
    return assessment.map((assessment) => ({
      id: assessment.id,
      name: assessment.name,
      created_by: assessment.createdBy,
      organization: assessment.organization,
      regions: assessment.regions,
      role_arn: assessment.roleArn,
      workflows: assessment.workflows,
      created_at: assessment.createdAt.toISOString(),
      step: assessment.step,
      ...(assessment.error && {
        error: {
          cause: assessment.error.cause,
          error: assessment.error.error,
        },
      }),
    }));
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
      const convertedAssessments = this.convertToAPIAssessment(assessments);
      return { assessments: convertedAssessments, next_token: nextToken };
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
