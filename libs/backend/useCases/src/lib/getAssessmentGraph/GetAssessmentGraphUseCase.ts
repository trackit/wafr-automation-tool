import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
  tokenLogger,
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
  version?: number;
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
  private readonly logger = inject(tokenLogger);

  public async getAssessmentGraph(
    args: GetAssessmentGraphUseCaseArgs,
  ): Promise<AssessmentGraph> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
      version: args.version,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.user.organizationDomain,
      });
    }
    const version = args.version ?? assessment.latestVersionNumber;
    const [aggregations, totalFindings] = await Promise.all([
      this.findingsRepository.aggregateAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version,
        fields: GRAPH_FIELDS,
      }),
      this.findingsRepository.countAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version,
      }),
    ]);

    this.logger.info('Assessment Graph retrieved successfully');

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
