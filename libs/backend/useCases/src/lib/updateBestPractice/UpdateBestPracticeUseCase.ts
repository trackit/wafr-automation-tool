import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  EmptyUpdateBodyError,
  PillarNotFoundError,
  QuestionNotFoundError,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import type { BestPracticeBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../Errors';

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
    try {
      const { user, ...remaining } = args;
      await this.assessmentsRepository.updateBestPractice({
        organization: user.organizationDomain,
        ...remaining,
      });
    } catch (e) {
      if (
        e instanceof AssessmentNotFoundError ||
        e instanceof PillarNotFoundError ||
        e instanceof QuestionNotFoundError ||
        e instanceof BestPracticeNotFoundError
      ) {
        throw new NotFoundError(e.message);
      } else if (e instanceof EmptyUpdateBodyError) {
        throw new NoContentError(e.description);
      }
      throw e;
    }
  }
}

export const tokenUpdateBestPracticeUseCase =
  createInjectionToken<UpdateBestPracticeUseCase>('UpdateBestPracticeUseCase', {
    useClass: UpdateBestPracticeUseCaseImpl,
  });
