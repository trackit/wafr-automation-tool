import {
  MilestoneNotFoundError,
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import type { Pillar } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';
import { assertOrganizationHasExportRole } from '../../services';

export interface GetMilestonePillarsUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
  milestoneId: number;
  region: string;
}

export interface GetMilestonePillarsUseCase {
  getMilestonePillars(args: GetMilestonePillarsUseCaseArgs): Promise<Pillar[]>;
}

export class GetMilestonePillarsUseCaseImpl
  implements GetMilestonePillarsUseCase
{
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async getMilestonePillars(
    args: GetMilestonePillarsUseCaseArgs
  ): Promise<Pillar[]> {
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
    assertOrganizationHasExportRole(organization);
    return await this.wellArchitectedToolService
      .getMilestonePillars({
        roleArn: organization.assessmentExportRoleArn,
        assessment,
        region,
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

export const tokenGetMilestonePillarsUseCase =
  createInjectionToken<GetMilestonePillarsUseCase>(
    'GetMilestonePillarsUseCase',
    {
      useClass: GetMilestonePillarsUseCaseImpl,
    }
  );
