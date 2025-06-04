import {
  tokenAssessmentsStateMachine,
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';

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

  public async deleteAssessment(
    args: DeleteAssessmentUseCaseArgs
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
    this.logger.info(`Assessment#${args.assessmentId} deleted successfully`);
  }
}

export const tokenDeleteAssessmentUseCase =
  createInjectionToken<DeleteAssessmentUseCase>('DeleteAssessmentUseCase', {
    useClass: DeleteAssessmentUseCaseImpl,
  });
