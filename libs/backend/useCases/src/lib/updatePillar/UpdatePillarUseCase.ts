import {
  AssessmentNotFoundError,
  EmptyUpdateBodyError,
  PillarNotFoundError,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import type { PillarBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../Errors';

export type UpdatePillarUseCaseArgs = {
  user: User;
  assessmentId: string;
  pillarId: string;
  pillarBody: PillarBody;
};

export interface UpdatePillarUseCase {
  updatePillar(args: UpdatePillarUseCaseArgs): Promise<void>;
}

export class UpdatePillarUseCaseImpl implements UpdatePillarUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async updatePillar(args: UpdatePillarUseCaseArgs): Promise<void> {
    try {
      const { user, ...remaining } = args;
      await this.assessmentsRepository.updatePillar({
        organization: user.organizationDomain,
        ...remaining,
      });
    } catch (e) {
      if (
        e instanceof AssessmentNotFoundError ||
        e instanceof PillarNotFoundError
      ) {
        throw new NotFoundError(e.message);
      } else if (e instanceof EmptyUpdateBodyError) {
        throw new NoContentError(e.description);
      }
      throw e;
    }
  }
}

export const tokenUpdatePillarUseCase =
  createInjectionToken<UpdatePillarUseCase>('UpdatePillarUseCase', {
    useClass: UpdatePillarUseCaseImpl,
  });
