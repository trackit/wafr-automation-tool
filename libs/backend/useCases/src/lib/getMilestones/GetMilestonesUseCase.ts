import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { Milestone } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';
import { assertOrganizationHasExportRole } from '../../services';

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
    } else if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${organizationDomain}`
      );
    }
    assertOrganizationHasExportRole(organization);
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
