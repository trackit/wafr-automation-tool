import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
  tokenFindingsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type DeleteAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface DeleteAssessmentUseCase {
  deleteAssessment(args: DeleteAssessmentUseCaseArgs): Promise<void>;
}

export class DeleteAssessmentUseCaseImpl implements DeleteAssessmentUseCase {
  private readonly assessmentsStateMachine = inject(
    tokenAssessmentsStateMachine
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly logger = inject(tokenLogger);

  private async deleteAssessmentFromRepository(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    await this.findingsRepository.deleteAll({
      assessmentId,
      organizationDomain: organization,
    });
    await this.assessmentsRepository.delete({
      assessmentId,
      organizationDomain: organization,
    });
  }

  public async deleteAssessment(
    args: DeleteAssessmentUseCaseArgs
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
    await this.assessmentsStateMachine.cancelAssessment(
      assessment.executionArn
    );
    await this.deleteAssessmentFromRepository({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });
    this.logger.info(`Assessment#${args.assessmentId} deleted successfully`);
  }
}

export const tokenDeleteAssessmentUseCase =
  createInjectionToken<DeleteAssessmentUseCase>('DeleteAssessmentUseCase', {
    useClass: DeleteAssessmentUseCaseImpl,
  });
