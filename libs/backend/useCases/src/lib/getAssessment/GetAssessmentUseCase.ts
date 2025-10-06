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
    assessment: Assessment
  ): Promise<BestPracticesFindingCounts> {
    const pillars = assessment.pillars ?? [];

    const bestPracticeDescriptors = pillars.flatMap((pillar) =>
      pillar.questions.flatMap((question) =>
        question.bestPractices.map((bestPractice) => ({
          pillarId: pillar.id,
          questionId: question.id,
          bestPracticeId: bestPractice.id,
        }))
      )
    );

    const countKey = ({
      pillarId,
      questionId,
      bestPracticeId,
    }: {
      pillarId: string;
      questionId: string;
      bestPracticeId: string;
    }): string => `${pillarId}:${questionId}:${bestPracticeId}`;
    const countResults = await Promise.all(
      bestPracticeDescriptors.map((descriptor) =>
        this.findingsRepository.countBestPracticeFindings({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          pillarId: descriptor.pillarId,
          questionId: descriptor.questionId,
          bestPracticeId: descriptor.bestPracticeId,
        })
      )
    );
    const countsByBestPractice = new Map<string, number>(
      bestPracticeDescriptors.map((descriptor, index) => [
        countKey(descriptor),
        countResults[index] ?? 0,
      ])
    );

    return pillars.reduce<BestPracticesFindingCounts>((accumulator, pillar) => {
      if (!accumulator[pillar.id]) {
        accumulator[pillar.id] = {};
      }
      const pillarCounts = accumulator[pillar.id];

      pillar.questions.forEach((question) => {
        if (!pillarCounts[question.id]) {
          pillarCounts[question.id] = {};
        }
        const questionCounts = pillarCounts[question.id];

        question.bestPractices.forEach((bestPractice) => {
          questionCounts[bestPractice.id] =
            countsByBestPractice.get(
              countKey({
                pillarId: pillar.id,
                questionId: question.id,
                bestPracticeId: bestPractice.id,
              })
            ) ?? 0;
        });
      });

      return accumulator;
    }, {});
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

    const bestPracticesFindingsAmount = await this.getBestPracticeFindings(
      assessment
    );

    return {
      assessment,
      bestPracticesFindingsAmount,
    };
  }
}

export const tokenGetAssessmentUseCase =
  createInjectionToken<GetAssessmentUseCase>('GetAssessmentUseCase', {
    useClass: GetAssessmentUseCaseImpl,
  });
