import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { FindingBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

export type UpdateFindingUseCaseArgs = {
  assessmentId: string;
  findingId: string;
  user: User;
  findingBody: FindingBody;
};

export interface UpdateFindingUseCase {
  updateFinding(args: UpdateFindingUseCaseArgs): Promise<void>;
}

export class UpdateFindingUseCaseImpl implements UpdateFindingUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateFinding(args: UpdateFindingUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, user, findingBody } = args;
    await this.assessmentsRepository.updateFinding({
      assessmentId,
      organization: user.organizationDomain,
      findingId,
      findingBody,
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
