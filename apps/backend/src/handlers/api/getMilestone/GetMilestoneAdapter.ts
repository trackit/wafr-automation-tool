import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import type { Milestone } from '@backend/models';
import { tokenGetMilestoneUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { MilestoneInvalidIdError } from '../../../errors';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetMilestonePathSchema = z.object({
  assessmentId: z.uuid(),
  milestoneId: z.string().nonempty(),
}) satisfies ZodType<operations['getMilestone']['parameters']['path']>;

const GetMilestoneQuerySchema = z.object({
  region: z.string().nonempty().optional(),
}) satisfies ZodType<operations['getMilestone']['parameters']['query']>;

export class GetMilestoneAdapter {
  private readonly useCase = inject(tokenGetMilestoneUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private toGetMilestoneResponse(
    milestone: Milestone,
  ): operations['getMilestone']['responses']['200']['content']['application/json'] {
    return {
      ...milestone,
      // createdAt date needs to be stringified
      createdAt: milestone.createdAt.toISOString(),
      pillars: milestone.pillars.map((pillar) => ({
        ...pillar,
        questions: pillar.questions.map((question) => ({
          ...question,
          bestPractices: question.bestPractices.map((bestPractice) => ({
            ...bestPractice,
            findingAmount: 0,
          })),
        })),
      })),
    };
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['getMilestone']['responses']['200']['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = parseApiEvent(event, {
      pathSchema: GetMilestonePathSchema,
      querySchema: GetMilestoneQuerySchema,
    });
    const { assessmentId, milestoneId } = pathParameters;
    const { region } = queryStringParameters;

    const milestoneIdNumber = Number(milestoneId);
    if (isNaN(milestoneIdNumber)) {
      throw new MilestoneInvalidIdError({ milestoneId });
    }

    const user = getUserFromEvent(event);
    const milestone = await this.useCase.getMilestone({
      organizationDomain: user.organizationDomain,
      assessmentId,
      milestoneId: milestoneIdNumber,
      region,
    });
    return this.toGetMilestoneResponse(milestone);
  }
}
