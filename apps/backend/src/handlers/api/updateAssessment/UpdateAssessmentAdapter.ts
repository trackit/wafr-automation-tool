import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenUpdateAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const UpdateAssessmentPathSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['updateAssessment']['parameters']['path']>;

const UpdateAssessmentBodySchema = z.object({
  name: z.string().nonempty().optional(),
}) satisfies ZodType<
  operations['updateAssessment']['requestBody']['content']['application/json']
>;

export class UpdateAssessmentAdapter {
  private readonly useCase = inject(tokenUpdateAssessmentUseCase);

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
  ): Promise<operations['updateAssessment']['responses']['200']['content']> {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: UpdateAssessmentPathSchema,
      bodySchema: UpdateAssessmentBodySchema,
    });
    const { assessmentId } = pathParameters;

    const user = getUserFromEvent(event);

    await this.useCase.updateAssessment({
      organization: user.organizationDomain,
      assessmentId,
      assessmentBody: body,
    });
  }
}
