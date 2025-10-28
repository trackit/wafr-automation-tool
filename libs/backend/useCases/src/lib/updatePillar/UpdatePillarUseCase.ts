import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { PillarBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { assertPillarExists } from '../../services/asserts';

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
    const { user, assessmentId, pillarId, pillarBody } = args;
    const { organizationDomain } = user;

    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain,
      });
    }
    assertPillarExists({
      assessment,
      pillarId,
    });

    await this.assessmentsRepository.updatePillar({
      assessmentId,
      organizationDomain,
      pillarId,
      pillarBody,
    });
  }
}

export const tokenUpdatePillarUseCase =
  createInjectionToken<UpdatePillarUseCase>('UpdatePillarUseCase', {
    useClass: UpdatePillarUseCaseImpl,
  });
