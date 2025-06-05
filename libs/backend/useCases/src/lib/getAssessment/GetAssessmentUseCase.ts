import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { Assessment, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';

export type GetAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface GetAssessmentUseCase {
  getAssessment(args: GetAssessmentUseCaseArgs): Promise<Assessment>;
}

export class GetAssessmentUseCaseImpl implements GetAssessmentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async getAssessment(
    args: GetAssessmentUseCaseArgs
  ): Promise<Assessment> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.user.organizationDomain}`
      );
    }
    return assessment;
  }
}

export const tokenGetAssessmentUseCase =
  createInjectionToken<GetAssessmentUseCase>('GetAssessmentUseCase', {
    useClass: GetAssessmentUseCaseImpl,
  });
