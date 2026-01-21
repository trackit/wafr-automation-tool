import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

export type GetOrganizationUseCaseArgs = {
  organizationDomain: string;
};

export type OpportunitiesPerMonthItem = {
  month: string;
  opportunities: number;
};

type OrganizationDetails = {
  currentYearTotalAssessments: number;
  opportunitiesPerMonth: OpportunitiesPerMonthItem[];
  folders?: string[];
  folderCounts?: Record<string, number>;
};

export interface GetOrganizationUseCase {
  getOrganizationDetails(
    args: GetOrganizationUseCaseArgs,
  ): Promise<OrganizationDetails>;
}

export class GetOrganizationUseCaseImpl implements GetOrganizationUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly logger = inject(tokenLogger);

  async getOrganizationDetails(
    args: GetOrganizationUseCaseArgs,
  ): Promise<OrganizationDetails> {
    const { organizationDomain } = args;
    const now = new Date();
    const currentYear = now.getFullYear();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const currentYearTotalAssessments =
      await this.assessmentsRepository.countAssessmentsByYear({
        organizationDomain,
        year: currentYear,
      });

    const currentYearOpportunities =
      await this.assessmentsRepository.getOpportunitiesByYear({
        organizationDomain,
        year: currentYear,
      });

    const previousYearOpportunities =
      await this.assessmentsRepository.getOpportunitiesByYear({
        organizationDomain,
        year: currentYear - 1,
      });

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    });

    const map: Record<string, number> = Object.fromEntries(
      months.map((m) => [m, 0]),
    );

    for (const opportunity of [
      ...previousYearOpportunities,
      ...currentYearOpportunities,
    ]) {
      const opportunityCreatedAt = opportunity.createdAt;
      if (opportunityCreatedAt < start || opportunityCreatedAt > now) continue;

      const key = `${String(opportunityCreatedAt.getMonth() + 1).padStart(2, '0')}-${opportunityCreatedAt.getFullYear()}`;
      if (key in map) map[key]++;
    }

    const opportunitiesPerMonth = months.map((m) => ({
      month: m,
      opportunities: map[m],
    }));

    const organization =
      await this.organizationRepository.get(organizationDomain);
    const folders = organization?.folders ?? [];

    const folderCounts =
      await this.assessmentsRepository.countAssessmentsByFolder({
        organizationDomain,
      });

    this.logger.info(`The organization details retrieved successfully`);

    return {
      currentYearTotalAssessments,
      opportunitiesPerMonth,
      folders,
      folderCounts,
    };
  }
}

export const tokenGetOrganizationUseCase =
  createInjectionToken<GetOrganizationUseCase>('GetAssessmentUseCase', {
    useClass: GetOrganizationUseCaseImpl,
  });
