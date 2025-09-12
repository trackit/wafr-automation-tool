import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import type { Finding, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { assertBestPracticeExists } from '../../services/asserts';

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
  private readonly findingsRepository = inject(tokenFindingsRepository);

  public async getBestPracticeFindings(
    args: GetBestPracticeFindingsUseCaseArgs
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }> {
    const {
      user,
      assessmentId,
      pillarId,
      questionId,
      bestPracticeId,
      nextToken,
      limit,
      searchTerm,
      showHidden,
    } = args;
    const organizationDomain = user.organizationDomain;

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

    return await this.findingsRepository.getBestPracticeFindings({
      organizationDomain,
      assessmentId,
      pillarId,
      questionId,
      bestPracticeId,
      nextToken,
      limit,
      searchTerm,
      showHidden,
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
