import {
  isDatabaseUnavailableError,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import { type Assessment, type User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { DatabaseUnavailableError } from '../../errors';

export type GetAssessmentsUseCaseArgs = {
  user: User;
  limit?: number;
  search?: string;
  nextToken?: string;
};

export interface GetAssessmentsUseCase {
  getAssessments(
    args: GetAssessmentsUseCaseArgs,
  ): Promise<{ assessments: Assessment[]; nextToken?: string }>;
}

export class GetAssessmentsUseCaseImpl implements GetAssessmentsUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async getAssessments(
    args: GetAssessmentsUseCaseArgs,
  ): Promise<{ assessments: Assessment[]; nextToken?: string }> {
    try {
      const { user, ...remaining } = args;
      return await this.assessmentsRepository.getAll({
        organizationDomain: user.organizationDomain,
        ...remaining,
      });
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }
}

export const tokenGetAssessmentsUseCase =
  createInjectionToken<GetAssessmentsUseCase>('GetAssessmentsUseCase', {
    useClass: GetAssessmentsUseCaseImpl,
  });
