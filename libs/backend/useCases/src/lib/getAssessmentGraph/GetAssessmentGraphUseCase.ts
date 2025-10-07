import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import type {
  FindingAggregationFields,
  FindingAggregationResult,
  User,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors/AssessmentErrors';

export type GetAssessmentGraphUseCaseArgs = {
  assessmentId: string;
  user: User;
};

const GRAPH_FIELDS = {
  severity: true,
  resources: { region: true, type: true },
} as const satisfies FindingAggregationFields;

type AssessmentGraph = FindingAggregationResult<typeof GRAPH_FIELDS> & {
  findings: number;
};

export interface GetAssessmentGraphUseCase {
  getAssessmentGraph(
    args: GetAssessmentGraphUseCaseArgs,
  ): Promise<AssessmentGraph>;
}

export class GetAssessmentGraphUseCaseImpl
  implements GetAssessmentGraphUseCase
{
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);

  public async getAssessmentGraph(
    args: GetAssessmentGraphUseCaseArgs,
  ): Promise<AssessmentGraph> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.user.organizationDomain,
      });
    }
    const [aggregations, totalFindings] = await Promise.all([
      this.findingsRepository.aggregateAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        fields: GRAPH_FIELDS,
      }),
      this.findingsRepository.countAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      }),
    ]);

    return {
      ...aggregations,
      findings: totalFindings,
    };
  }
}

export const tokenGetAssessmentGraphUseCase =
  createInjectionToken<GetAssessmentGraphUseCase>('GetAssessmentGraphUseCase', {
    useClass: GetAssessmentGraphUseCaseImpl,
  });
