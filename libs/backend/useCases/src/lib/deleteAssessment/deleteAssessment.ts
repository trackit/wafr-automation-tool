import {
  tokenAssessmentsStateMachine,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';

export type DeleteAssessmentUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface DeleteAssessmentUseCase {
  deleteAssessment(
    args: DeleteAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }>;
}

export class DeleteAssessmentUseCaseImpl implements DeleteAssessmentUseCase {
  private readonly stateMachine = inject(tokenAssessmentsStateMachine);
  private readonly repository = inject(tokenAssessmentsRepository);

  public async deleteAssessment(
    args: DeleteAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }> {
    throw new Error(
      'DeleteAssessmentUseCaseImpl.deleteAssessment is not implemented yet'
    );
  }
}

export const tokenDeleteAssessmentUseCase =
  createInjectionToken<DeleteAssessmentUseCase>('DeleteAssessmentUseCase', {
    useClass: DeleteAssessmentUseCaseImpl,
  });
