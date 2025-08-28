import {
  MilestoneNotFoundError,
  tokenAssessmentsRepository,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { Milestone } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ConflictError, NotFoundError } from '../Errors';
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
    return await this.wellArchitectedToolService
      .getMilestone({
        roleArn: organization.assessmentExportRoleArn,
        assessment,
        region: milestonesRegion,
        milestoneId,
      })
      .catch((error) => {
        if (error instanceof MilestoneNotFoundError) {
          throw new NotFoundError(
            `Milestone with id ${milestoneId} not found for assessment ${assessmentId}`
          );
        }
        throw error;
      });
  }
}

export const tokenGetMilestoneUseCase =
  createInjectionToken<GetMilestoneUseCase>('GetMilestoneUseCase', {
    useClass: GetMilestoneUseCaseImpl,
  });
