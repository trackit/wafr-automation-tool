import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenRescanAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const RescanAssessmentArgsSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['rescanAssessment']['parameters']['path']>;

export class RescanAssessmentAdapter {
  private readonly useCase = inject(tokenRescanAssessmentUseCase);

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
  ): Promise<operations['rescanAssessment']['responses']['200']['content']> {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: RescanAssessmentArgsSchema,
    });

    await this.useCase.rescanAssessment({
      user: getUserFromEvent(event),
      ...pathParameters,
    });
  }
}
