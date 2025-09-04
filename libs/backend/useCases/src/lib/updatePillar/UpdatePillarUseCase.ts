import { tokenAssessmentsRepository } from '@backend/infrastructure';
import type { PillarBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

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
    const { user, ...remaining } = args;
    await this.assessmentsRepository.updatePillar({
      organization: user.organizationDomain,
      ...remaining,
    });
  }
}

export const tokenUpdatePillarUseCase =
  createInjectionToken<UpdatePillarUseCase>('UpdatePillarUseCase', {
    useClass: UpdatePillarUseCaseImpl,
  });
