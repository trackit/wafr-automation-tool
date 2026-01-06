import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import { AssessmentVersionBody, type User } from '@backend/models';
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
    tokenWellArchitectedToolService,
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);

  public async exportAssessment(
    args: ExportWellArchitectedToolUseCaseArgs,
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
    const organization = await this.organizationRepository.get(
      args.user.organizationDomain,
    );
    if (!organization) {
      throw new OrganizationNotFoundError({
        domain: args.user.organizationDomain,
      });
    }
    assertOrganizationHasExportRole(organization);
    const { workloadArn } =
      await this.wellArchitectedToolService.exportAssessment({
        roleArn: organization.assessmentExportRoleArn,
        assessment,
        // Non-null assertion since exportRegion and args.region are checked in assertAssessmentIsReadyForExport
        region: (args.region ?? assessment.exportRegion)!,
        user: args.user,
      });
    const assessmentVersionBody: AssessmentVersionBody = {
      wafrWorkloadArn: workloadArn,
    };
    if (!assessment.exportRegion) {
      assessmentVersionBody.exportRegion = args.region;
      this.logger.info(
        `Updating export region for assessment ${assessment.id}-${assessment.latestVersionNumber} to ${args.region}`,
      );
    }
    await this.assessmentsRepository.updateVersion({
      assessmentId: assessment.id,
      organizationDomain: args.user.organizationDomain,
      version: assessment.latestVersionNumber,
      assessmentVersionBody,
    });
    this.logger.info(
      `Export for assessment ${assessment.id}-${assessment.latestVersionNumber} to the Well Architected Tool finished`,
    );
  }
}

export const tokenExportWellArchitectedToolUseCase =
  createInjectionToken<ExportWellArchitectedToolUseCase>(
    'ExportWellArchitectedToolUseCase',
    {
      useClass: ExportWellArchitectedToolUseCaseImpl,
    },
  );
