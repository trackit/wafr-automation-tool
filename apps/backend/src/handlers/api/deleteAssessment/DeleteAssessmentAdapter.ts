import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenDeleteAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const DeleteAssessmentPathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['deleteAssessment']['parameters']['path']>;

export class DeleteAssessmentAdapter {
  private readonly useCase = inject(tokenDeleteAssessmentUseCase);

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
  ): Promise<operations['deleteAssessment']['responses']['200']['content']> {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: DeleteAssessmentPathSchema,
    });

    const user = getUserFromEvent(event);

    await this.useCase.deleteAssessment({
      ...pathParameters,
      user,
    });
  }
}
