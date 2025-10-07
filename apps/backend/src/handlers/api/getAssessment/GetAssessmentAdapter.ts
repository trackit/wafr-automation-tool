import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodType } from 'zod';

import type { Assessment } from '@backend/models';
import {
  BestPracticesFindingCounts,
  tokenGetAssessmentUseCase,
} from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetAssessmentPathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['getAssessment']['parameters']['path']>;

export class GetAssessmentAdapter {
  private readonly useCase = inject(tokenGetAssessmentUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private toGetAssessmentResponse(args: {
    assessment: Assessment;
    bestPracticesFindingsAmount: BestPracticesFindingCounts;
  }): operations['getAssessment']['responses'][200]['content']['application/json'] {
    const { assessment, bestPracticesFindingsAmount } = args;
    return {
      createdAt: assessment.createdAt.toISOString(),
      createdBy: assessment.createdBy,
      pillars:
        assessment.pillars?.map((pillar) => ({
          disabled: pillar.disabled,
          id: pillar.id,
          label: pillar.label,
          questions: pillar.questions.map((question) => ({
            bestPractices: question.bestPractices.map((bestPractice) => ({
              description: bestPractice.description,
              id: bestPractice.id,
              label: bestPractice.label,
              risk: bestPractice.risk,
              checked: bestPractice.checked,
              findingAmount:
                bestPracticesFindingsAmount[pillar.id]?.[question.id]?.[
                  bestPractice.id
                ],
            })),
            disabled: question.disabled,
            id: question.id,
            label: question.label,
            none: question.none,
          })),
        })) ?? [],
      id: assessment.id,
      name: assessment.name,
      organization: assessment.organization,
      questionVersion: assessment.questionVersion,
      regions: assessment.regions,
      exportRegion: assessment.exportRegion,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
      error: assessment.error,
      wafrWorkloadArn: assessment.wafrWorkloadArn,
      opportunityId: assessment.opportunityId,
    };
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['getAssessment']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: GetAssessmentPathSchema,
    });
    const { assessmentId } = pathParameters;

    const user = getUserFromEvent(event);

    const result = await this.useCase.getAssessment({
      organizationDomain: user.organizationDomain,
      assessmentId,
    });

    return this.toGetAssessmentResponse(result);
  }
}
