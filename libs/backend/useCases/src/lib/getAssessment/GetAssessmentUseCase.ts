import {
  isDatabaseUnavailableError,
  tokenAssessmentsRepository,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import type { Assessment, BillingInformation } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  DatabaseUnavailableError,
} from '../../errors';

export type GetAssessmentUseCaseArgs = {
  assessmentId: string;
  organizationDomain: string;
  version?: number;
};

export type BestPracticesFindingCounts = Record<
  string,
  Record<string, Record<string, number>>
>;

export interface GetAssessmentUseCase {
  getAssessment(args: GetAssessmentUseCaseArgs): Promise<{
    assessment: Assessment;
    bestPracticesFindingsAmount: BestPracticesFindingCounts;
  }>;
}

export class GetAssessmentUseCaseImpl implements GetAssessmentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);

  private async getBestPracticeFindings(
    assessment: Assessment,
    version: number,
  ): Promise<BestPracticesFindingCounts> {
    const bestPracticeFindingCounts: BestPracticesFindingCounts = {};
    const allBestPractices =
      assessment.pillars?.flatMap((pillar) =>
        pillar.questions.flatMap((question) =>
          question.bestPractices.map((bp) => ({
            pillarId: pillar.id,
            questionId: question.id,
            bestPracticeId: bp.id,
          })),
        ),
      ) ?? [];

    const countPromises = allBestPractices.map(async (entry) => {
      const count = await this.findingsRepository.countBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version,
        pillarId: entry.pillarId,
        questionId: entry.questionId,
        bestPracticeId: entry.bestPracticeId,
      });

      return {
        ...entry,
        count: count ?? 0,
      };
    });
    const counts = await Promise.all(countPromises);

    for (const { pillarId, questionId, bestPracticeId, count } of counts) {
      bestPracticeFindingCounts[pillarId] ??= {};
      bestPracticeFindingCounts[pillarId][questionId] ??= {};
      bestPracticeFindingCounts[pillarId][questionId][bestPracticeId] = count;
    }

    return bestPracticeFindingCounts;
  }

  private filterZeroCostServices(
    billingInformation?: BillingInformation,
  ): BillingInformation | undefined {
    if (!billingInformation) {
      return undefined;
    }

    const filteredServicesCost = billingInformation.servicesCost.filter(
      (service) => {
        const cost = parseFloat(service.cost);
        return cost > 0;
      },
    );

    return {
      ...billingInformation,
      servicesCost: filteredServicesCost,
    };
  }

  public async getAssessment(args: GetAssessmentUseCaseArgs): Promise<{
    assessment: Assessment;
    bestPracticesFindingsAmount: BestPracticesFindingCounts;
  }> {
    try {
      const assessment = await this.assessmentsRepository.get({
        assessmentId: args.assessmentId,
        organizationDomain: args.organizationDomain,
        version: args.version,
      });
      if (!assessment) {
        throw new AssessmentNotFoundError({
          assessmentId: args.assessmentId,
          organizationDomain: args.organizationDomain,
        });
      }

      const bestPracticesFindingsAmount = await this.getBestPracticeFindings(
        assessment,
        args.version ?? assessment.latestVersionNumber,
      );

      return {
        assessment: {
          ...assessment,
          billingInformation: this.filterZeroCostServices(
            assessment?.billingInformation,
          ),
        },
        bestPracticesFindingsAmount,
      };
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }
}

export const tokenGetAssessmentUseCase =
  createInjectionToken<GetAssessmentUseCase>('GetAssessmentUseCase', {
    useClass: GetAssessmentUseCaseImpl,
  });
