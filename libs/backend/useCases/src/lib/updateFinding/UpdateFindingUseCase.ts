import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { FindingBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError, FindingNotFoundError } from '../../errors';

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
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateFinding(args: UpdateFindingUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, user, findingBody } = args;
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
    const finding = await this.findingsRepository.get({
      assessmentId,
      organizationDomain,
      version: assessment.latestVersionNumber,
      findingId,
    });
    if (!finding) {
      throw new FindingNotFoundError({
        assessmentId,
        organizationDomain,
        findingId,
      });
    }

    await this.findingsRepository.update({
      assessmentId,
      organizationDomain: user.organizationDomain,
      version: assessment.latestVersionNumber,
      findingId,
      findingBody,
    });
    this.logger.info(
      `Finding ${findingId} for assessment ${assessmentId} in organization ${user.organizationDomain} updated successfully`,
    );
  }
}

export const tokenUpdateFindingUseCase =
  createInjectionToken<UpdateFindingUseCase>('UpdateFindingUseCase', {
    useClass: UpdateFindingUseCaseImpl,
  });
