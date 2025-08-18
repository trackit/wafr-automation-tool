import {
  tokenAssessmentsRepository,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { Milestone } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ConflictError, NotFoundError } from '../Errors';
import { assertOrganizationHasExportRole } from '../../services';

export interface GetMilestonesUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  region?: string;
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
    } else if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${organizationDomain}`
      );
    }
    const milestonesRegion = region ?? assessment.exportRegion;
    if (!milestonesRegion) {
      throw new ConflictError(
        `Assessment with id ${assessmentId} has no export region set`
      );
    }
    assertOrganizationHasExportRole(organization);
    return this.wellArchitectedToolService.getMilestones({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      region: milestonesRegion,
    });
  }
}

export const tokenGetMilestonesUseCase =
  createInjectionToken<GetMilestonesUseCase>('GetMilestonesUseCase', {
    useClass: GetMilestonesUseCaseImpl,
  });
