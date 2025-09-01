import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
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

  private async deleteAssessmentFromRepository(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    await this.assessmentsRepository.deleteFindings({
      assessmentId,
      organization,
    });
    await this.assessmentsRepository.delete({
      assessmentId,
      organization,
    });
  }
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
    await this.deleteAssessmentFromRepository({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });

    await this.assessmentsStateMachine.startAssessment({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
      createdAt: new Date(),
      createdBy: args.user.id,
      name: assessment.name,
      regions: assessment.regions,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
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
