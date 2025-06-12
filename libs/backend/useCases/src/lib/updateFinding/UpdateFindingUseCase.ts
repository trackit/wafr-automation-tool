import {
  AssessmentNotFoundError,
  EmptyUpdateBodyError,
  FindingNotFoundError,
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../Errors';

export type UpdateFindingUseCaseArgs = {
  assessmentId: string;
  findingId: string;
  user: User;
  findingBody: {
    hidden?: boolean;
  };
};

export interface UpdateFindingUseCase {
  updateFinding(args: UpdateFindingUseCaseArgs): Promise<void>;
}

export class UpdateFindingUseCaseImpl implements UpdateFindingUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateFinding(args: UpdateFindingUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, user, findingBody } = args;
    await this.assessmentsRepository
      .updateFinding({
        assessmentId,
        organization: user.organizationDomain,
        findingId,
        findingBody,
      })
      .catch((error) => {
        if (
          error instanceof AssessmentNotFoundError ||
          error instanceof FindingNotFoundError
        ) {
          throw new NotFoundError(error.message);
        } else if (error instanceof EmptyUpdateBodyError) {
          throw new NoContentError('No content to update for finding');
        }
        throw error;
      });
    this.logger.info(
      `Finding ${findingId} for assessment ${assessmentId} in organization ${user.organizationDomain} updated successfully`
    );
  }
}

export const tokenUpdateFindingUseCase =
  createInjectionToken<UpdateFindingUseCase>('UpdateFindingUseCase', {
    useClass: UpdateFindingUseCaseImpl,
  });
