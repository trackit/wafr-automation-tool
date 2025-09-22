import {
  tokenAssessmentsRepository,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { MilestoneSummary } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFoundError,
  OrganizationNotFoundError,
} from '../../errors';
import { assertOrganizationHasExportRole } from '../../services';

export interface GetMilestonesUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  region?: string;
  limit?: number;
  nextToken?: string;
}

export interface GetMilestonesUseCase {
  getMilestones(args: GetMilestonesUseCaseArgs): Promise<{
    milestones: MilestoneSummary[];
    nextToken?: string;
  }>;
}

export class GetMilestonesUseCaseImpl implements GetMilestonesUseCase {
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async getMilestones(args: GetMilestonesUseCaseArgs): Promise<{
    milestones: MilestoneSummary[];
    nextToken?: string;
  }> {
    const { organizationDomain, assessmentId, region, limit, nextToken } = args;
    const [organization, assessment] = await Promise.all([
      this.organizationRepository.get(organizationDomain),
      this.assessmentsRepository.get({
        assessmentId,
        organizationDomain: organizationDomain,
      }),
    ]);
    if (!organization) {
      throw new OrganizationNotFoundError({ domain: organizationDomain });
    } else if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain: organizationDomain,
      });
    }
    const milestonesRegion = region ?? assessment.exportRegion;
    if (!milestonesRegion) {
      throw new AssessmentExportRegionNotSetError({ assessmentId });
    }
    assertOrganizationHasExportRole(organization);
    return this.wellArchitectedToolService.getMilestones({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      region: milestonesRegion,
      limit,
      nextToken,
    });
  }
}

export const tokenGetMilestonesUseCase =
  createInjectionToken<GetMilestonesUseCase>('GetMilestonesUseCase', {
    useClass: GetMilestonesUseCaseImpl,
  });
