import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import {
  tokenCognitoService,
  UserNotFoundError,
} from '@backend/infrastructure';
import type { Finding } from '@backend/models';
import { tokenGetBestPracticeFindingsUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError, NotFoundError } from '../../../utils/api/HttpError';

const GetBestPracticeFindingsPathArgsSchema = z.object({
  assessmentId: z.string().uuid(),
  pillarId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  bestPracticeId: z.string().nonempty(),
}) satisfies ZodType<
  operations['getBestPracticeFindings']['parameters']['path']
>;

const GetBestPracticeFindingsQueryArgsSchema = z.object({
  limit: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
  showHidden: z.coerce.boolean().optional(),
  nextToken: z.string().nonempty().base64().optional(),
}) satisfies ZodType<
  operations['getBestPracticeFindings']['parameters']['query']
>;

export class GetBestPracticeFindingsAdapter {
  private readonly useCase = inject(tokenGetBestPracticeFindingsUseCase);
  private readonly cognitoService = inject(tokenCognitoService);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async toGetBestPracticeFindingsItemsResponse(
    findings: Finding[]
  ): Promise<
    operations['getBestPracticeFindings']['responses']['200']['content']['application/json']['items']
  > {
    const usersId = Array.from(
      new Set(
        findings.flatMap((f) => (f.comments ?? []).map((c) => c.authorId))
      )
    );

    const users = await Promise.all(
      usersId.map((userId) => this.cognitoService.getUserById({ userId }))
    );

    return findings.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      statusCode: finding.statusCode,
      statusDetail: finding.statusDetail,
      hidden: finding.hidden,
      ...(finding.resources && {
        resources: finding.resources.map((resource) => ({
          uid: resource.uid,
          name: resource.name,
          type: resource.type,
          region: resource.region,
        })),
      }),
      ...(finding.remediation && {
        remediation: {
          desc: finding.remediation.desc,
          references: finding.remediation.references,
        },
      }),
      riskDetails: finding.riskDetails,
      isAIAssociated: finding.isAIAssociated,
      ...(finding.comments && {
        comments: finding.comments.map((comment) => ({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          authorEmail: users.find((user) => user.id === comment.authorId)
            ?.email,
        })),
      }),
    }));
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['getBestPracticeFindings']['responses']['200']['content']['application/json']
  > {
    const { pathParameters, queryStringParameters } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }

    try {
      const parsedPathParameters =
        GetBestPracticeFindingsPathArgsSchema.parse(pathParameters);
      const parsedQueryParameters =
        GetBestPracticeFindingsQueryArgsSchema.parse(queryStringParameters);
      const { findings, nextToken } =
        await this.useCase.getBestPracticeFindings({
          user: getUserFromEvent(event),
          ...parsedPathParameters,
          limit: parsedQueryParameters.limit,
          nextToken: parsedQueryParameters.nextToken,
          searchTerm: parsedQueryParameters.search,
          showHidden: parsedQueryParameters.showHidden,
        });
      return {
        items: await this.toGetBestPracticeFindingsItemsResponse(findings),
        nextToken,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(`Invalid parameters: ${error.message}`);
      } else if (error instanceof UserNotFoundError) {
        throw new NotFoundError(error.message);
      }
      throw error;
    }
  }
}
