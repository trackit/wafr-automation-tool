import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { BestPracticeBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

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
    args: UpdateBestPracticeUseCaseArgs
  ): Promise<void> {
    const { user, ...remaining } = args;
    await this.assessmentsRepository.updateBestPractice({
      organization: user.organizationDomain,
      ...remaining,
    });
  }
}

export const tokenUpdateBestPracticeUseCase =
  createInjectionToken<UpdateBestPracticeUseCase>('UpdateBestPracticeUseCase', {
    useClass: UpdateBestPracticeUseCaseImpl,
  });
