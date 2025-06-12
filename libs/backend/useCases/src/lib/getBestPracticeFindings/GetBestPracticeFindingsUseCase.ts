import {
  BestPracticeNotFoundError,
  InvalidNextTokenError,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import type { Finding, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { InvalidParametersError, NotFoundError } from '../Errors';

export interface GetBestPracticeFindingsUseCaseArgs {
  assessmentId: string;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  user: User;
  limit?: number;
  nextToken?: string;
  searchTerm?: string;
  showHidden?: boolean;
}

export interface GetBestPracticeFindingsUseCase {
  getBestPracticeFindings(args: GetBestPracticeFindingsUseCaseArgs): Promise<{
    findings: Finding[];
    nextToken?: string;
  }>;
}

export class GetBestPracticeFindingsUseCaseImpl
  implements GetBestPracticeFindingsUseCase
{
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async getBestPracticeFindings(
    args: GetBestPracticeFindingsUseCaseArgs
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }> {
    const { user, ...remaining } = args;
    return this.assessmentsRepository
      .getBestPracticeFindings({
        organization: user.organizationDomain,
        ...remaining,
      })
      .catch((error) => {
        if (error instanceof InvalidNextTokenError) {
          throw new InvalidParametersError(error.message);
        } else if (error instanceof BestPracticeNotFoundError) {
          throw new NotFoundError(error.message);
        }
        throw error;
      });
  }
}

export const tokenGetBestPracticeFindingsUseCase =
  createInjectionToken<GetBestPracticeFindingsUseCase>(
    'GetBestPracticeFindingsUseCase',
    {
      useClass: GetBestPracticeFindingsUseCaseImpl,
    }
  );
