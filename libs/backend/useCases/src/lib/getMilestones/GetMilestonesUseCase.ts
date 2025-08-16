import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { Milestone } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ConflictError, NotFoundError } from '../Errors';

export interface GetMilestonesUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  region: string;
}

export interface GetMilestonesUseCase {
  getMilestones(args: GetMilestonesUseCaseArgs): Promise<Milestone[]>;
}

export class GetMilestonesUseCaseImpl implements GetMilestonesUseCase {
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async getMilestones(
    args: GetMilestonesUseCaseArgs
  ): Promise<Milestone[]> {
    const { organizationDomain, assessmentId, region } = args;
    const [organization, assessment] = await Promise.all([
      this.organizationRepository.get({
        organizationDomain,
      }),
      this.assessmentsRepository.get({
        assessmentId,
        organization: organizationDomain,
      }),
    ]);
    if (!organization) {
      throw new NotFoundError(
        `Organization with domain ${organizationDomain} not found`
      );
    } else if (!organization.assessmentExportRoleArn) {
      this.logger.error(
        `No assessment export role ARN found for organization ${organization.domain}`
      );
      throw new ConflictError(
        `No assessment export role ARN found for organization ${organization.domain}`
      );
    } else if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${organizationDomain}`
      );
    }
    return this.wellArchitectedToolService.getMilestones({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      region,
    });
  }
}

export const tokenGetMilestonesUseCase =
  createInjectionToken<GetMilestonesUseCase>('GetMilestonesUseCase', {
    useClass: GetMilestonesUseCaseImpl,
  });
