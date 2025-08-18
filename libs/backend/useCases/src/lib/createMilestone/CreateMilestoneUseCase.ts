import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';
import {
  assertAssessmentIsReadyForExport,
  assertOrganizationHasExportRole,
} from '../../services/exports';

export interface CreateMilestoneUseCaseArgs {
  assessmentId: string;
  user: User;
  region?: string;
  name: string;
}

export interface CreateMilestoneUseCase {
  createMilestone(args: CreateMilestoneUseCaseArgs): Promise<void>;
}

export class CreateMilestoneUseCaseImpl implements CreateMilestoneUseCase {
  private readonly logger = inject(tokenLogger);
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);

  public async createMilestone(
    args: CreateMilestoneUseCaseArgs
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
    assertAssessmentIsReadyForExport(assessment, args.region);
    const organization = await this.organizationRepository.get({
      organizationDomain: args.user.organizationDomain,
    });
    if (!organization) {
      throw new NotFoundError(
        `Organization with domain ${args.user.organizationDomain} not found`
      );
    }
    assertOrganizationHasExportRole(organization);
    await this.wellArchitectedToolService.createMilestone({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      // Non-null assertion since exportRegion and args.region are checked in assertAssessmentIsReadyForExport
      region: (args.region ?? assessment.exportRegion)!,
      name: args.name,
      user: args.user,
    });
    this.logger.info(
      `Create Milestone for assessment ${assessment.id} to the Well Architected Tool finished`
    );
  }
}

export const tokenCreateMilestoneUseCase =
  createInjectionToken<CreateMilestoneUseCase>('CreateMilestoneUseCase', {
    useClass: CreateMilestoneUseCaseImpl,
  });
