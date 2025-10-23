import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

export type GetOrganizationUseCaseArgs = {
  organizationDomain: string;
};
type OrganizationDetails = {
  totalAssessments: number;
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
    let totalAssessments = 0;
    const currentYear = new Date().getFullYear();
    let nextToken: string | undefined = undefined;
    do {
      const { assessments, nextToken: newNextToken } =
        await this.assessmentsRepository.getAll({
          organizationDomain,
          limit: 100,
          nextToken,
        });
      totalAssessments += assessments.filter(
        (a) => a.createdAt.getFullYear() === currentYear,
      ).length;
      nextToken = newNextToken;
    } while (nextToken);
    const opportunities = await this.assessmentsRepository.getOpportunities({
      organizationDomain,
    });
    const currentYearOpportunities = opportunities.filter(
      (o) => o.opportunityCreatedAt.getFullYear() === currentYear,
    );
    const opportunitiesPerMonth: { [month: string]: number } = {};
    for (let m = 1; m <= 12; m++) {
      const key = m.toString().padStart(2, '0');
      opportunitiesPerMonth[key] = 0;
    }

    for (const opp of currentYearOpportunities) {
      const month = (opp.opportunityCreatedAt.getMonth() + 1)
        .toString()
        .padStart(2, '0');
      opportunitiesPerMonth[month]++;
    }
    const ans = {
      totalAssessments,
      opportunitiesPerMonth,
    };
    this.logger.info(`${JSON.stringify(ans)}`);
    return ans;
  }
}

export const tokenGetOrganizationUseCase =
  createInjectionToken<GetOrganizationUseCase>('GetAssessmentUseCase', {
    useClass: GetOrganizationUseCaseImpl,
  });
