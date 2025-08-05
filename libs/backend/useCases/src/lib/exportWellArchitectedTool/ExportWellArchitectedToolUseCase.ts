import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';
import { assertAssessmentIsReadyForExport } from '../../services/exports';

export type ExportWellArchitectedToolUseCaseArgs = {
  assessmentId: string;
  region: string;
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
      organization: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.user.organizationDomain}`
      );
    }
    assertAssessmentIsReadyForExport(assessment);
    const organization = await this.organizationRepository.get({
      organizationDomain: args.user.organizationDomain,
    });
    if (!organization) {
      throw new NotFoundError(
        `Organization with domain ${args.user.organizationDomain} not found`
      );
    }
    if (!organization.assessmentExportRoleArn) {
      this.logger.error(
        `No assessment export role ARN found for organization ${args.user.organizationDomain}`
      );
      throw new ConflictError(
        `No assessment export role ARN found for organization ${args.user.organizationDomain}`
      );
    }
    await this.wellArchitectedToolService.exportAssessment({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      region: args.region,
      user: args.user,
    });
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
