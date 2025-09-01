import {
  AssessmentNotFoundError,
  EmptyUpdateBodyError,
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { AssessmentBody } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { NoContentError, NotFoundError } from '../Errors';

export type UpdateAssessmentUseCaseArgs = {
  assessmentId: string;
  organization: string;
  assessmentBody: AssessmentBody;
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
        organization: args.organization,
        assessmentBody: args.assessmentBody,
      })
      .catch((error) => {
        if (error instanceof AssessmentNotFoundError) {
          throw new NotFoundError(error.message);
        } else if (error instanceof EmptyUpdateBodyError) {
          throw new NoContentError(error.description);
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
