import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenGetAssessmentGraphUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetAssessmentGraphArgsSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['getAssessmentGraph']['parameters']['path']>;

const GetAssessmentGraphQueryArgsSchema = z.object({
  version: z.coerce.number().int().optional(),
}) satisfies ZodType<operations['getAssessmentGraph']['parameters']['query']>;

export class GetAssessmentGraphAdapter {
  private readonly useCase = inject(tokenGetAssessmentGraphUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['getAssessmentGraph']['responses'][200]['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = parseApiEvent(event, {
      pathSchema: GetAssessmentGraphArgsSchema,
      querySchema: GetAssessmentGraphQueryArgsSchema,
    });

    const user = getUserFromEvent(event);

    return await this.useCase.getAssessmentGraph({
      ...pathParameters,
      version: queryStringParameters?.version,
      user,
    });
  }
}
