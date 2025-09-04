import {
  tokenAssessmentsRepository,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { Milestone } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFoundError,
  OrganizationNotFoundError,
} from '../../errors';
import { assertOrganizationHasExportRole } from '../../services';

export interface GetMilestoneUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  milestoneId: number;
  region?: string;
}

export interface GetMilestoneUseCase {
  getMilestone(args: GetMilestoneUseCaseArgs): Promise<Milestone>;
}

export class GetMilestoneUseCaseImpl implements GetMilestoneUseCase {
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async getMilestone(args: GetMilestoneUseCaseArgs): Promise<Milestone> {
    const { organizationDomain, assessmentId, region, milestoneId } = args;
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
      throw new OrganizationNotFoundError({ organization: organizationDomain });
    }
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organization: organizationDomain,
      });
    }
    const milestonesRegion = region ?? assessment.exportRegion;
    if (!milestonesRegion) {
      throw new AssessmentExportRegionNotSetError({ assessmentId });
    }
    assertOrganizationHasExportRole(organization);
    return await this.wellArchitectedToolService.getMilestone({
      roleArn: organization.assessmentExportRoleArn,
      assessment,
      region: milestonesRegion,
      milestoneId,
    });
  }
}

export const tokenGetMilestoneUseCase =
  createInjectionToken<GetMilestoneUseCase>('GetMilestoneUseCase', {
    useClass: GetMilestoneUseCaseImpl,
  });
