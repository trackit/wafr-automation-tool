import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import { tokenStartAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const StartAssessmentBodySchema = z.object({
  name: z.string().nonempty(),
  regions: z.array(z.string().nonempty()).nonempty().optional(),
  roleArn: z.string().nonempty(),
  workflows: z.array(z.string().nonempty()).nonempty().optional(),
}) satisfies ZodType<
  operations['startAssessment']['requestBody']['content']['application/json']
>;

export class StartAssessmentAdapter {
  private readonly useCase = inject(tokenStartAssessmentUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 201,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['startAssessment']['responses'][201]['content']['application/json']
  > {
    const { body } = parseApiEvent(event, {
      bodySchema: StartAssessmentBodySchema,
    });

    const { assessmentId } = await this.useCase.startAssessment({
      user: getUserFromEvent(event),
      ...body,
    });
    return { assessmentId };
  }
}
