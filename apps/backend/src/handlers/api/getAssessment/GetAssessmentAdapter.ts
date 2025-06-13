import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import type { Assessment } from '@backend/models';
import { tokenGetAssessmentUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { BadRequestError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

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
      created_at: assessment.createdAt.toISOString(),
      created_by: assessment.createdBy,
      findings:
        assessment.findings?.map((pillar) => ({
          disabled: pillar.disabled,
          id: pillar.id,
          label: pillar.label,
          questions: pillar.questions.map((question) => ({
            best_practices: question.bestPractices.map((bestPractice) => ({
              description: bestPractice.description,
              id: bestPractice.id,
              label: bestPractice.label,
              results: bestPractice.results,
              risk: bestPractice.risk,
              checked: bestPractice.checked,
            })),
            disabled: question.disabled,
            id: question.id,
            label: question.label,
            none: question.none,
          })),
        })) ?? [],
      ...(assessment.graphDatas && {
        graph_datas: {
          findings: assessment.graphDatas.findings,
          regions: assessment.graphDatas.regions,
          resource_types: assessment.graphDatas.resourceTypes,
          severities: assessment.graphDatas.severities,
        },
      }),
      id: assessment.id,
      name: assessment.name,
      organization: assessment.organization,
      question_version: assessment.questionVersion,
      ...(assessment.rawGraphDatas && {
        raw_graph_datas: Object.entries(assessment.rawGraphDatas).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: {
              findings: value.findings,
              regions: value.regions,
              resource_types: value.resourceTypes,
              severities: value.severities,
            },
          }),
          {}
        ),
      }),
      regions: assessment.regions,
      role_arn: assessment.roleArn,
      step: assessment.step,
      workflows: assessment.workflows,
      ...(assessment.error && {
        error: {
          Cause: assessment.error.cause,
          Error: assessment.error.error,
        },
      }),
    };
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['getAssessment']['responses'][200]['content']['application/json']
  > {
    const { pathParameters } = event;
    if (!pathParameters) {
      throw new BadRequestError('Missing path parameters');
    }

    try {
      const { assessmentId } = GetAssessmentArgsSchema.parse(pathParameters);
      const assessment = await this.useCase.getAssessment({
        user: getUserFromEvent(event),
        assessmentId,
      });
      return this.toGetAssessmentResponse(assessment);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid path parameters: ${e.message}`);
      }
      throw e;
    }
  }
}
