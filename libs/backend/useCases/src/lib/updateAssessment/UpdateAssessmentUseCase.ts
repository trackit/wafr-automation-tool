import {
  AssessmentNotFoundError,
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';

export type UpdateAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
  assessmentData: {
    name?: string;
  };
};

export interface UpdateAssessmentUseCase {
  updateAssessment(args: UpdateAssessmentUseCaseArgs): Promise<void>;
}

export class UpdateAssessmentUseCaseImpl implements UpdateAssessmentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateAssessment(
    args: UpdateAssessmentUseCaseArgs
  ): Promise<void> {
    await this.assessmentsRepository
      .update({
        assessmentId: args.assessmentId,
        organization: args.user.organizationDomain,
        ...args.assessmentData,
      })
      .catch((error) => {
        if (error instanceof AssessmentNotFoundError) {
          throw new NotFoundError(error.message);
        }
        throw error;
      });
    this.logger.info(`Assessment#${args.assessmentId} updated successfully`);
  }
}

export const tokenUpdateAssessmentUseCase =
  createInjectionToken<UpdateAssessmentUseCase>('UpdateAssessmentUseCase', {
    useClass: UpdateAssessmentUseCaseImpl,
  });
