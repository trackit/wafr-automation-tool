import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import type { Assessment } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type GetAssessmentUseCaseArgs = {
  assessmentId: string;
  organizationDomain: string;
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

  public async getAssessment(args: GetAssessmentUseCaseArgs): Promise<{
    assessment: Assessment;
    bestPracticesFindingsAmount: BestPracticesFindingCounts;
  }> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.organizationDomain,
      });
    }

    const bestPracticesFindingsAmount =
      await this.getBestPracticeFindings(assessment);

    return { assessment, bestPracticesFindingsAmount };
  }
}

export const tokenGetAssessmentUseCase =
  createInjectionToken<GetAssessmentUseCase>('GetAssessmentUseCase', {
    useClass: GetAssessmentUseCaseImpl,
  });
