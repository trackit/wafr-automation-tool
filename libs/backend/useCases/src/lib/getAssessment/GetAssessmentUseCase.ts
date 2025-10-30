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
    const accumulator: BestPracticesFindingCounts = {};

    const countPromises: Promise<void>[] = [];

    for (const pillar of assessment.pillars ?? []) {
      if (!accumulator[pillar.id]) accumulator[pillar.id] = {};
      const pillarCounts = accumulator[pillar.id];

      for (const question of pillar.questions) {
        if (!pillarCounts[question.id]) pillarCounts[question.id] = {};
        const questionCounts = pillarCounts[question.id];

        for (const bestPractice of question.bestPractices) {
          const promise = this.findingsRepository
            .countBestPracticeFindings({
              assessmentId: assessment.id,
              organizationDomain: assessment.organization,
              pillarId: pillar.id,
              questionId: question.id,
              bestPracticeId: bestPractice.id,
            })
            .then((count) => {
              questionCounts[bestPractice.id] = count ?? 0;
            });

          countPromises.push(promise);
        }
      }
    }

    await Promise.all(countPromises);

    return accumulator;
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
