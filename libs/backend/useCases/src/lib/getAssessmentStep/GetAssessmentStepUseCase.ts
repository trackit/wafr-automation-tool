import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
} from '@backend/infrastructure';
import { AssessmentStep, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors/AssessmentErrors';

export type GetAssessmentStepUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface GetAssessmentStepUseCase {
  getAssessmentStep(
    args: GetAssessmentStepUseCaseArgs,
  ): Promise<AssessmentStep>;
}

export class GetAssessmentStepUseCaseImpl implements GetAssessmentStepUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly stateMachine = inject(tokenAssessmentsStateMachine);

  public async getAssessmentStep(
    args: GetAssessmentStepUseCaseArgs,
  ): Promise<AssessmentStep> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.user.organizationDomain,
      });
    }
    // Avoid interacting with state machine if we already know the assessment is finished or errored
    if (assessment.finished) {
      return AssessmentStep.FINISHED;
    }
    if (assessment.error) {
      return AssessmentStep.ERRORED;
    }
    if (!assessment.executionArn) {
      return AssessmentStep.SCANNING_STARTED;
    }
    return this.stateMachine.getAssessmentStep(assessment.executionArn);
  }
}

export const tokenGetAssessmentStepUseCase =
  createInjectionToken<GetAssessmentStepUseCase>('GetAssessmentStepUseCase', {
    useClass: GetAssessmentStepUseCaseImpl,
  });
