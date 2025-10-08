import {
  tokenAssessmentsRepository,
  tokenCostExplorerService,
  tokenLogger,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  OrganizationNotFoundError,
} from '../../errors';

export interface GetBillingInformationUseCaseArgs {
  assessmentId: string;
  organizationDomain: string;
}

export interface GetBillingInformationUseCase {
  getBillingInformation(args: GetBillingInformationUseCaseArgs): Promise<void>;
}

export class GetBillingInformationUseCaseImpl
  implements GetBillingInformationUseCase
{
  private readonly logger = inject(tokenLogger);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly costExplorerService = inject(tokenCostExplorerService);

  private extractAccountId(roleArn: string | undefined): string {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  }

  private formatDateAsYMD(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  public async getBillingInformation(
    args: GetBillingInformationUseCaseArgs,
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.organizationDomain,
      });
    }
    const organization = await this.organizationRepository.get(
      args.organizationDomain,
    );
    if (!organization) {
      throw new OrganizationNotFoundError({
        domain: args.organizationDomain,
      });
    }

    const accountId = this.extractAccountId(assessment.roleArn);
    const createdAt = assessment.createdAt;
    const endDate = this.formatDateAsYMD(createdAt);
    const startDateObj = createdAt;
    startDateObj.setUTCDate(startDateObj.getUTCDate() - 30);
    const startDate = this.formatDateAsYMD(startDateObj);
    const timePeriod: { startDate: string; endDate: string } = {
      startDate,
      endDate,
    };
    const regions = assessment.regions;

    const billingInformation =
      await this.costExplorerService.getBillingInformation({
        accountId,
        timePeriod,
        regions,
        roleArn: assessment.roleArn,
      });

    this.logger.info(
      `Retrieved billing information for assessment ${args.assessmentId}`,
    );

    await this.assessmentsRepository.updateBillingInformation({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      billingInformation: billingInformation,
    });

    this.logger.info(
      `Billing information added for assessment with id ${args.assessmentId}`,
    );
  }
}

export const tokenGetBillingInformationUseCase =
  createInjectionToken<GetBillingInformationUseCase>(
    'GetBillingInformationUseCase',
    { useClass: GetBillingInformationUseCaseImpl },
  );
