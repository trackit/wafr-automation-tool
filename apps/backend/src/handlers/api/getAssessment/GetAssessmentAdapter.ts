import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import type { Assessment } from '@backend/models';
import { tokenGetAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetAssessmentArgsSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['getAssessment']['parameters']['path']>;

export class GetAssessmentAdapter {
  private readonly useCase = inject(tokenGetAssessmentUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private toGetAssessmentResponse(
    assessment: Assessment
  ): operations['getAssessment']['responses'][200]['content']['application/json'] {
    return {
      ...assessment,
      createdAt: assessment.createdAt.toISOString(),
      pillars:
        assessment.pillars?.map((pillar) => ({
          ...pillar,
          questions: pillar.questions.map((question) => ({
            ...question,
            bestPractices: question.bestPractices.map((bestPractice) => ({
              ...bestPractice,
              results: [...bestPractice.results],
            })),
          })),
        })) ?? [],
    };
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['getAssessment']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: GetAssessmentArgsSchema,
    });
    const { assessmentId } = pathParameters;

    const assessment = await this.useCase.getAssessment({
      organization: getUserFromEvent(event).organizationDomain,
      assessmentId,
    });

    return this.toGetAssessmentResponse(assessment);
  }
}
