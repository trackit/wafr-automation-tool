import {
  InvalidNextTokenError,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import { Assessment, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { InvalidParametersError } from '../Errors';

export type GetAssessmentsUseCaseArgs = {
  user: User;
  limit?: number;
  search?: string;
  nextToken?: string;
};

export interface GetAssessmentsUseCase {
  getAssessments(
    args: GetAssessmentsUseCaseArgs
  ): Promise<{ assessments: Assessment[]; nextToken?: string }>;
}

export class GetAssessmentsUseCaseImpl implements GetAssessmentsUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async getAssessments(
    args: GetAssessmentsUseCaseArgs
  ): Promise<{ assessments: Assessment[]; nextToken?: string }> {
    const { user, ...remaining } = args;
    try {
      const response = await this.assessmentsRepository.getAll({
        organization: user.organizationDomain,
        ...remaining,
      });
      return response;
    } catch (error) {
      if (error instanceof InvalidNextTokenError) {
        throw new InvalidParametersError('Invalid next token');
      }
      throw error;
    }
  }
}

export const tokenGetAssessmentsUseCase =
  createInjectionToken<GetAssessmentsUseCase>('GetAssessmentsUseCase', {
    useClass: GetAssessmentsUseCaseImpl,
  });
