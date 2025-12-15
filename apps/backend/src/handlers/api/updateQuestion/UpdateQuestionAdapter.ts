import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenUpdateQuestionUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const UpdateQuestionPathSchema = z.object({
  assessmentId: z.uuid(),
  pillarId: z.string().nonempty(),
  questionId: z.string().nonempty(),
}) satisfies ZodType<operations['updateQuestion']['parameters']['path']>;

const UpdateQuestionBodySchema = z
  .object({
    none: z.boolean(),
    disabled: z.boolean(),
  })
  .partial()
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), {
    message: 'At least one property must be provided',
  }) satisfies ZodType<
  operations['updateQuestion']['requestBody']['content']['application/json']
>;

export class UpdateQuestionAdapter {
  private readonly useCase = inject(tokenUpdateQuestionUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: UpdateQuestionPathSchema,
      bodySchema: UpdateQuestionBodySchema,
    });
    const { assessmentId, pillarId, questionId } = pathParameters;

    const user = getUserFromEvent(event);

    await this.useCase.updateQuestion({
      assessmentId,
      pillarId,
      questionId,
      user,
      questionBody: body,
    });
  }
}
