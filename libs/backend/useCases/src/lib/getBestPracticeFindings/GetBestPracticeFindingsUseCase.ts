import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { Finding, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

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
    return await this.assessmentsRepository.getBestPracticeFindings({
      organization: user.organizationDomain,
      ...remaining,
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
