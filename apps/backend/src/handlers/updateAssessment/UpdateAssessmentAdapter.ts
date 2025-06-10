import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { tokenUpdateAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { JSONParseError, parseJson } from '@shared/utils';

import { BadRequestError } from '../../utils/HttpError';
import { getUserFromEvent } from '../../utils/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../utils/handleHttpRequest';

const UpdateAssessmentPathParametersSchema = z.object({
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['updateAssessment']['parameters']['path']>;

const UpdateAssessmentBodySchema = z.object({
  name: z.string().nonempty().optional(),
}) satisfies ZodType<
  operations['updateAssessment']['requestBody']['content']['application/json']
>;

export class UpdateAssessmentAdapter {
  private readonly useCase = inject(tokenUpdateAssessmentUseCase);

  private parseBody(
    body: string
  ): operations['updateAssessment']['requestBody']['content']['application/json'] {
    const parsedBody = parseJson(body);
    return UpdateAssessmentBodySchema.parse(parsedBody);
  }

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
  ): Promise<operations['updateAssessment']['responses']['200']['content']> {
    const { pathParameters, body } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }
    if (!body) {
      throw new BadRequestError('Missing request body');
    }

    try {
      const { assessmentId } =
        UpdateAssessmentPathParametersSchema.parse(pathParameters);
      const assessmentData = this.parseBody(body);
      await this.useCase.updateAssessment({
        user: getUserFromEvent(event),
        assessmentId,
        assessmentData,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(`Invalid path parameters: ${error.message}`);
      } else if (error instanceof JSONParseError) {
        throw new BadRequestError(
          `Invalid JSON in request body: ${error.message}`
        );
      }
      throw error;
    }
  }
}
