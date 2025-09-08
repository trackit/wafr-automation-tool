import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { Assessment } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type GetAssessmentUseCaseArgs = {
  assessmentId: string;
  organization: string;
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
      organizationDomain: args.organization,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.organization,
      });
    }
    return assessment;
  }
}

export const tokenGetAssessmentUseCase =
  createInjectionToken<GetAssessmentUseCase>('GetAssessmentUseCase', {
    useClass: GetAssessmentUseCaseImpl,
  });
