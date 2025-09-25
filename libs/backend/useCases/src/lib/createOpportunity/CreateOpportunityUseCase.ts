import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenPartnerCentralSellingService,
} from '@backend/infrastructure';
import { CustomerType, OpportunityDetails, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { assertOrganizationHasAceIntegration } from '../../services/exports';
import { ConflictError, NotFoundError } from '../Errors';

export type CreateOpportunityUseCaseArgs = {
  user: User;
  assessmentId: string;
  opportunityDetails: OpportunityDetails;
};

export interface CreateOpportunityUseCase {
  createOpportunity(args: CreateOpportunityUseCaseArgs): Promise<void>;
}

export class CreateOpportunityUseCaseImpl implements CreateOpportunityUseCase {
  private readonly logger = inject(tokenLogger);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly partnerCentralSellingService = inject(
    tokenPartnerCentralSellingService
  );

  public extractAccountId(roleArn: string | undefined): string {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  }

  public async createOpportunity(
    args: CreateOpportunityUseCaseArgs
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.user.organizationDomain}`
      );
    }
    if (assessment.opportunityId) {
      throw new ConflictError(
        `Assessment with id ${args.assessmentId} is linked already to opportunity ${assessment.opportunityId}`
      );
    }
    const organization = await this.organizationRepository.get({
      organizationDomain: args.user.organizationDomain,
    });
    if (!organization) {
      throw new NotFoundError(
        `Organization with domain ${args.user.organizationDomain} not found`
      );
    }
    assertOrganizationHasAceIntegration(organization);

    const accountId = this.extractAccountId(assessment.roleArn);
    const customerBusinessProblem =
      args.opportunityDetails.customerType == CustomerType.INTERNAL_WORKLOAD
        ? `Internal Workload (${assessment.name})`
        : args.opportunityDetails.companyName;

    const opportunityId =
      await this.partnerCentralSellingService.createOpportunity({
        assessment,
        organizationName: organization.name,
        aceIntegration: organization.aceIntegration,
        opportunityDetails: args.opportunityDetails,
        accountId,
        customerBusinessProblem,
      });
    await this.assessmentsRepository.update({
      assessmentId: assessment.id,
      organization: args.user.organizationDomain,
      assessmentBody: { opportunityId: opportunityId },
    });
    this.logger.info(
      `Assigned opportunity ${opportunityId} to assessment ${assessment.id}`
    );
  }
}

export const tokenCreateOpportunityUseCase =
  createInjectionToken<CreateOpportunityUseCase>('CreateOpportunityUseCase', {
    useClass: CreateOpportunityUseCaseImpl,
  });
