import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenRescanAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const RescanAssessmentPathSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['rescanAssessment']['parameters']['path']>;

export class RescanAssessmentAdapter {
  private readonly useCase = inject(tokenRescanAssessmentUseCase);

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
  ): Promise<operations['rescanAssessment']['responses']['200']['content']> {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: RescanAssessmentPathSchema,
    });

    const user = getUserFromEvent(event);

    await this.useCase.rescanAssessment({
      ...pathParameters,
      user,
    });
  }
}
