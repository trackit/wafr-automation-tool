import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
  tokenFindingsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import { type User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type RescanAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface RescanAssessmentUseCase {
  rescanAssessment(args: RescanAssessmentUseCaseArgs): Promise<void>;
}

export class RescanAssessmentUseCaseImpl implements RescanAssessmentUseCase {
  private readonly assessmentsStateMachine = inject(
    tokenAssessmentsStateMachine,
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly logger = inject(tokenLogger);

  public async rescanAssessment(
    args: RescanAssessmentUseCaseArgs,
  ): Promise<void> {
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

    if (assessment.executionArn) {
      await this.assessmentsStateMachine.cancelAssessment(
        assessment.executionArn,
      );
    }
    await this.findingsRepository.deleteAll({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
    });

    const executionId = await this.assessmentsStateMachine.startAssessment({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
      createdAt: new Date(),
      createdBy: args.user.id,
      name: assessment.name,
      regions: assessment.regions,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
    });
    await this.assessmentsRepository.update({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
      assessmentBody: {
        executionArn: executionId,
      },
    });
    this.logger.info(
      `Assessment#${args.assessmentId} rescan started successfully`,
    );
  }
}

export const tokenRescanAssessmentUseCase =
  createInjectionToken<RescanAssessmentUseCase>('RescanAssessmentUseCase', {
    useClass: RescanAssessmentUseCaseImpl,
  });
