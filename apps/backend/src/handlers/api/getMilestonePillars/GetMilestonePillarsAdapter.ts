import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { Pillar } from '@backend/models';
import { inject } from '@shared/di-container';
import { operations } from '@shared/api-schema';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { tokenGetMilestonePillarsUseCase } from '@backend/useCases';

const GetMilestonePillarsPathSchema = z.object({
  assessmentId: z.string().uuid(),
  milestoneId: z.string(),
}) satisfies ZodType<operations['getMilestonePillars']['parameters']['path']>;

const GetMilestonePillarsQuerySchema = z.object({
  region: z.string().optional(),
}) satisfies ZodType<operations['getMilestonePillars']['parameters']['query']>;

export class GetMilestonePillarsAdapter {
  private readonly useCase = inject(tokenGetMilestonePillarsUseCase);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private toGetMilestonePillarsResponse(
    pillars: Pillar[]
  ): operations['getMilestonePillars']['responses']['200']['content']['application/json'] {
    return pillars.map((pillar) => ({
      ...pillar,
      questions: pillar.questions.map((question) => ({
        ...question,
        bestPractices: question.bestPractices.map((bestPractice) => ({
          ...bestPractice,
          results: [...bestPractice.results],
        })),
      })),
    }));
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['getMilestonePillars']['responses']['200']['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = event;
    try {
      const { assessmentId, milestoneId } =
        GetMilestonePillarsPathSchema.parse(pathParameters);
      const { region } = GetMilestonePillarsQuerySchema.parse(
        queryStringParameters
      );
      const milestoneIdNumber = Number(milestoneId);
      if (isNaN(milestoneIdNumber)) {
        throw new BadRequestError('Invalid milestoneId');
      }

      const user = getUserFromEvent(event);
      const pillars = await this.useCase.getMilestonePillars({
        organizationDomain: user.organizationDomain,
        assessmentId,
        milestoneId: milestoneIdNumber,
        region,
      });

      return this.toGetMilestonePillarsResponse(pillars);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request parameters: ${e.message}`);
      }
      throw e;
    }
  }
}
