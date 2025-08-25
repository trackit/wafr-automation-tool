import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { Milestone } from '@backend/models';
import { inject } from '@shared/di-container';
import { operations } from '@shared/api-schema';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { tokenGetMilestoneUseCase } from '@backend/useCases';

const GetMilestonePathSchema = z.object({
  assessmentId: z.string().uuid(),
  milestoneId: z.string(),
}) satisfies ZodType<operations['getMilestone']['parameters']['path']>;

const GetMilestoneQuerySchema = z.object({
  region: z.string().optional(),
}) satisfies ZodType<operations['getMilestone']['parameters']['query']>;

export class GetMilestoneAdapter {
  private readonly useCase = inject(tokenGetMilestoneUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private toGetMilestoneResponse(
    milestone: Milestone
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
            // results need to be transformed from Set to Array
            results: [...bestPractice.results],
          })),
        })),
      })),
    };
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['getMilestone']['responses']['200']['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = event;
    try {
      const { assessmentId, milestoneId } =
        GetMilestonePathSchema.parse(pathParameters);
      const { region } = GetMilestoneQuerySchema.parse(
        queryStringParameters ?? {}
      );
      const milestoneIdNumber = Number(milestoneId);
      if (isNaN(milestoneIdNumber)) {
        throw new BadRequestError('Invalid milestoneId');
      }

      const user = getUserFromEvent(event);
      const milestone = await this.useCase.getMilestone({
        organizationDomain: user.organizationDomain,
        assessmentId,
        milestoneId: milestoneIdNumber,
        region,
      });
      return this.toGetMilestoneResponse(milestone);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request parameters: ${e.message}`);
      }
      throw e;
    }
  }
}
