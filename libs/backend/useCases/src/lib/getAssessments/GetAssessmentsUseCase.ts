import { tokenAssessmentsRepository } from '@backend/infrastructure';
import { Assessment, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

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
    return await this.assessmentsRepository.getAll({
      organizationDomain: user.organizationDomain,
      ...remaining,
    });
  }
}

export const tokenGetAssessmentsUseCase =
  createInjectionToken<GetAssessmentsUseCase>('GetAssessmentsUseCase', {
    useClass: GetAssessmentsUseCaseImpl,
  });
