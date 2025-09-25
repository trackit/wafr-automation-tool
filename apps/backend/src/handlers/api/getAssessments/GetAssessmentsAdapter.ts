import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { Assessment } from '@backend/models';
import { tokenGetAssessmentsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetAssessmentsQuerySchema = z
  .object({
    limit: z.coerce.number().min(1, 'Limit must be greater than 0').optional(),
    search: z.string().nonempty().optional(),
    nextToken: z.string().trim().nonempty().base64().optional(),
  })
  .strict() satisfies ZodType<
  operations['getAssessments']['parameters']['query']
>;

export class GetAssessmentsAdapter {
  private readonly useCase = inject(tokenGetAssessmentsUseCase);

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
      createdBy: assessment.createdBy,
      organization: assessment.organization,
      regions: assessment.regions,
      exportRegion: assessment.exportRegion,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
      wafrWorkloadArn: assessment.wafrWorkloadArn,
      opportunityId: assessment.opportunityId,
      createdAt: assessment.createdAt.toISOString(),
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
    const { queryStringParameters } = parseApiEvent(event, {
      querySchema: GetAssessmentsQuerySchema,
    });

    const user = getUserFromEvent(event);

    const { assessments, nextToken } = await this.useCase.getAssessments({
      user,
      ...queryStringParameters,
    });
    return { assessments: this.convertToAPIAssessment(assessments), nextToken };
  }
}
