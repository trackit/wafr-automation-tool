import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { BestPracticeBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { assertBestPracticeExists } from '../../services/asserts';

export type UpdateBestPracticeUseCaseArgs = {
  user: User;
  assessmentId: string;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  bestPracticeBody: BestPracticeBody;
};

export interface UpdateBestPracticeUseCase {
  updateBestPractice(args: UpdateBestPracticeUseCaseArgs): Promise<void>;
}

export class UpdateBestPracticeUseCaseImpl
  implements UpdateBestPracticeUseCase
{
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async updateBestPractice(
    args: UpdateBestPracticeUseCaseArgs,
  ): Promise<void> {
    const {
      user,
      assessmentId,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeBody,
    } = args;
    const { organizationDomain } = user;

    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain,
      });
    }
    assertBestPracticeExists({
      assessment,
      pillarId,
      questionId,
      bestPracticeId,
    });

    await this.assessmentsRepository.updateBestPractice({
      organizationDomain: user.organizationDomain,
      assessmentId,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeBody,
    });
  }
}

export const tokenUpdateBestPracticeUseCase =
  createInjectionToken<UpdateBestPracticeUseCase>('UpdateBestPracticeUseCase', {
    useClass: UpdateBestPracticeUseCaseImpl,
  });
