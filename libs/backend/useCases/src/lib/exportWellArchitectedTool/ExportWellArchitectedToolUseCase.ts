import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  OrganizationNotFoundError,
} from '../../errors';
import {
  assertAssessmentIsReadyForExport,
  assertOrganizationHasExportRole,
} from '../../services/exports';

export type ExportWellArchitectedToolUseCaseArgs = {
  assessmentId: string;
  region?: string;
  user: User;
};

export interface ExportWellArchitectedToolUseCase {
  exportAssessment(args: ExportWellArchitectedToolUseCaseArgs): Promise<void>;
}

export class ExportWellArchitectedToolUseCaseImpl
  implements ExportWellArchitectedToolUseCase
{
  private readonly logger = inject(tokenLogger);
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);

  public async exportAssessment(
    args: ExportWellArchitectedToolUseCaseArgs
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
    assertAssessmentIsReadyForExport(assessment, args.region);
    const organization = await this.organizationRepository.get({
      organizationDomain: args.user.organizationDomain,
    });
    if (!organization) {
      throw new OrganizationNotFoundError({
        domain: args.user.organizationDomain,
      });
    }
    assertOrganizationHasExportRole(organization);
    await this.wellArchitectedToolService.exportAssessment({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      // Non-null assertion since exportRegion and args.region are checked in assertAssessmentIsReadyForExport
      region: (args.region ?? assessment.exportRegion)!,
      user: args.user,
    });
    if (!assessment.exportRegion) {
      await this.assessmentsRepository.update({
        assessmentId: assessment.id,
        organizationDomain: args.user.organizationDomain,
        assessmentBody: { exportRegion: args.region },
      });
      this.logger.info(
        `Export region for assessment ${assessment.id} updated to ${args.region}`
      );
    }
    this.logger.info(
      `Export for assessment ${assessment.id} to the Well Architected Tool finished`
    );
  }
}

export const tokenExportWellArchitectedToolUseCase =
  createInjectionToken<ExportWellArchitectedToolUseCase>(
    'ExportWellArchitectedToolUseCase',
    {
      useClass: ExportWellArchitectedToolUseCaseImpl,
    }
  );
