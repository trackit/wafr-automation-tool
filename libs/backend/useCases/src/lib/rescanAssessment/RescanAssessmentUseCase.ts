import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
  tokenLogger,
} from '@backend/infrastructure';
import { AssessmentStep, type User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { NotFoundError } from '../Errors';

export type RescanAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface RescanAssessmentUseCase {
  rescanAssessment(args: RescanAssessmentUseCaseArgs): Promise<void>;
}

export class RescanAssessmentUseCaseImpl implements RescanAssessmentUseCase {
  private readonly assessmentsStateMachine = inject(
    tokenAssessmentsStateMachine
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async rescanAssessment(
    args: RescanAssessmentUseCaseArgs
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.user.organizationDomain}`
      );
    }

    await this.assessmentsStateMachine.cancelAssessment(
      assessment.executionArn
    );
    await this.assessmentsRepository.deleteFindings({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });

    const executionId = await this.assessmentsStateMachine.startAssessment({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
      createdAt: new Date(),
      createdBy: args.user.id,
      name: assessment.name,
      regions: assessment.regions,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
    });
    await this.assessmentsRepository.update({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
      assessmentBody: {
        executionArn: executionId,
        step: AssessmentStep.SCANNING_STARTED,
      },
    });
    this.logger.info(
      `Assessment#${args.assessmentId} rescan started successfully`
    );
  }
}

export const tokenRescanAssessmentUseCase =
  createInjectionToken<RescanAssessmentUseCase>('RescanAssessmentUseCase', {
    useClass: RescanAssessmentUseCaseImpl,
  });
