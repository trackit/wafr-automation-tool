import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { AssessmentBody } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type UpdateAssessmentUseCaseArgs = {
  assessmentId: string;
  organizationDomain: string;
  assessmentBody: AssessmentBody;
};

export interface UpdateAssessmentUseCase {
  updateAssessment(args: UpdateAssessmentUseCaseArgs): Promise<void>;
}

export class UpdateAssessmentUseCaseImpl implements UpdateAssessmentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateAssessment(
    args: UpdateAssessmentUseCaseArgs,
  ): Promise<void> {
    const { organizationDomain, assessmentId, assessmentBody } = args;

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

    await this.assessmentsRepository.update({
      assessmentId,
      organizationDomain,
      assessmentBody,
    });
    this.logger.info(`Assessment successfully updated with id ${assessmentId}`);
  }
}

export const tokenUpdateAssessmentUseCase =
  createInjectionToken<UpdateAssessmentUseCase>('UpdateAssessmentUseCase', {
    useClass: UpdateAssessmentUseCaseImpl,
  });
