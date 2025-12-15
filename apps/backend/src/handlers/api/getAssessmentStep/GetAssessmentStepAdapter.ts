import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenGetAssessmentStepUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetAssessmentStepArgsSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['getAssessmentStep']['parameters']['path']>;

export class GetAssessmentStepAdapter {
  private readonly useCase = inject(tokenGetAssessmentStepUseCase);

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
    operations['getAssessmentStep']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: GetAssessmentStepArgsSchema,
    });

    const user = getUserFromEvent(event);

    return {
      step: await this.useCase.getAssessmentStep({
        ...pathParameters,
        user,
      }),
    };
  }
}
