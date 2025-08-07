import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import { AssessmentStep, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ConflictError, NoContentError, NotFoundError } from '../Errors';

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
    if (!assessment.pillars || assessment.step !== AssessmentStep.FINISHED) {
      throw new ConflictError(
        `Assessment with id ${assessment.id} is not finished`
      );
    }
    if (assessment.pillars.length === 0) {
      throw new NoContentError(
        `Assessment with id ${assessment.id} has no findings`
      );
    }
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
      throw new NotFoundError(
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
