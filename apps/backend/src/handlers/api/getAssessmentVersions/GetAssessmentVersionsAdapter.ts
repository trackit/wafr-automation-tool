import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenGetAssessmentVersionsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const GetAssessmentVersionsPathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['getAssessmentVersions']['parameters']['path']>;

const GetAssessmentVersionsQuerySchema = z.object({
  limit: z.coerce.number().min(1, 'Limit must be greater than 0').optional(),
  nextToken: z.base64().trim().nonempty().optional(),
}) satisfies ZodType<
  operations['getAssessmentVersions']['parameters']['query']
>;

export class GetAssessmentVersionsAdapter {
  private readonly useCase = inject(tokenGetAssessmentVersionsUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['getAssessmentVersions']['responses']['200']['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = parseApiEvent(event, {
      pathSchema: GetAssessmentVersionsPathSchema,
      querySchema: GetAssessmentVersionsQuerySchema,
    });
    const { assessmentId } = pathParameters;
    const { limit, nextToken } = queryStringParameters;

    const user = getUserFromEvent(event);
    const { versions, nextToken: responseNextToken } =
      await this.useCase.getAssessmentVersions({
        organizationDomain: user.organizationDomain,
        assessmentId,
        limit,
        nextToken,
      });
    return {
      versions: versions.map((version) => ({
        version: version.version,
        assessmentId: version.assessmentId,
        createdAt: version.createdAt.toISOString(),
        createdBy: version.createdBy,
        executionArn: version.executionArn,
        finishedAt: version.finishedAt?.toISOString(),
        error: version.error,
        wafrWorkloadArn: version.wafrWorkloadArn,
        exportRegion: version.exportRegion,
      })),
      nextToken: responseNextToken,
    };
  }
}
