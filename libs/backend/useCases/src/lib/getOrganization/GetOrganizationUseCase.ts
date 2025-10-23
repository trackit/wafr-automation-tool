import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

export type GetOrganizationUseCaseArgs = {
  organizationDomain: string;
};
type OrganizationDetails = {
  currentYearTotalAssessments: number;
  opportunitiesPerMonth: {
    [month: string]: number;
  };
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
    const currentYear = new Date().getFullYear();

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

    const opportunitiesPerMonth = currentYearOpportunities.reduce(
      (acc, opp) => {
        const month = (opp.opportunityCreatedAt.getMonth() + 1)
          .toString()
          .padStart(2, '0');
        acc[month]++;
        return acc;
      },
      Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [
          (i + 1).toString().padStart(2, '0'),
          0,
        ]),
      ),
    );

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
