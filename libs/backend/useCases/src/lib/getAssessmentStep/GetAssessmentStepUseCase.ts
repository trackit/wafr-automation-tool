import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
} from '@backend/infrastructure';
import type { AssessmentStep, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { NotFoundError } from '../Errors';

export type GetAssessmentStepUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface GetAssessmentStepUseCase {
  getAssessmentStep(
    args: GetAssessmentStepUseCaseArgs
  ): Promise<AssessmentStep>;
}

export class GetAssessmentStepUseCaseImpl implements GetAssessmentStepUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly stateMachine = inject(tokenAssessmentsStateMachine);

  public async getAssessmentStep(
    args: GetAssessmentStepUseCaseArgs
  ): Promise<AssessmentStep> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.user.organizationDomain}`
      );
    }
    return this.stateMachine.getAssessmentStep(assessment.executionArn);
  }
}

export const tokenGetAssessmentStepUseCase =
  createInjectionToken<GetAssessmentStepUseCase>('GetAssessmentStepUseCase', {
    useClass: GetAssessmentStepUseCaseImpl,
  });
