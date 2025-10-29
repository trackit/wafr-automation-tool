import {
  tokenAssessmentsRepository,
  tokenLogger,
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
};

export interface GetOrganizationUseCase {
  getOrganizationDetails(
    args: GetOrganizationUseCaseArgs,
  ): Promise<OrganizationDetails>;
}

export class GetOrganizationUseCaseImpl implements GetOrganizationUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
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

    const opportunityCurrYear =
      await this.assessmentsRepository.getOpportunitiesByYear({
        organizationDomain,
        year: currentYear,
      });

    const opportunityPrevYear =
      await this.assessmentsRepository.getOpportunitiesByYear({
        organizationDomain,
        year: currentYear - 1,
      });

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    });

    const map: Record<string, number> = Object.fromEntries(
      months.map((m) => [m, 0]),
    );

    for (const opp of [...opportunityPrevYear, ...opportunityCurrYear]) {
      const d = opp.opportunityCreatedAt;
      if (d < start || d > now) continue;

      const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      if (key in map) map[key]++;
    }

    const opportunitiesPerMonth = months.map((m) => ({
      month: m,
      opportunities: map[m],
    }));

    this.logger.info(`The organization details retrieved successfully`);

    return {
      currentYearTotalAssessments,
      opportunitiesPerMonth,
    };
  }
}

export const tokenGetOrganizationUseCase =
  createInjectionToken<GetOrganizationUseCase>('GetAssessmentUseCase', {
    useClass: GetOrganizationUseCaseImpl,
  });
