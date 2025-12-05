import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
  tokenPartnerCentralSellingService,
} from '@backend/infrastructure';
import { CustomerType, type OpportunityDetails, type User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  AssessmentOpportunityAlreadyLinkedError,
} from '../../errors/AssessmentErrors';
import {
  OrganizationAceDetailsNotFoundError,
  OrganizationNotFoundError,
} from '../../errors/OrganizationErrors';

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
    tokenPartnerCentralSellingService,
  );

  public extractAccountId(roleArn: string | undefined): string {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  }

  public async createOpportunity(
    args: CreateOpportunityUseCaseArgs,
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.user.organizationDomain,
      });
    }
    if (assessment.opportunityId) {
      throw new AssessmentOpportunityAlreadyLinkedError({
        assessmentId: args.assessmentId,
        opportunityId: assessment.opportunityId,
      });
    }
    const organization = await this.organizationRepository.get(
      args.user.organizationDomain,
    );
    if (!organization) {
      throw new OrganizationNotFoundError({
        domain: args.user.organizationDomain,
      });
    }
    if (!organization.aceIntegration) {
      throw new OrganizationAceDetailsNotFoundError({
        domain: organization.domain,
      });
    }

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
      organizationDomain: args.user.organizationDomain,
      assessmentBody: {
        opportunityId: opportunityId,
        opportunityCreatedAt: new Date(),
      },
    });
    this.logger.info(
      `Assigned opportunity ${opportunityId} to assessment ${assessment.id}`,
    );
  }
}

export const tokenCreateOpportunityUseCase =
  createInjectionToken<CreateOpportunityUseCase>('CreateOpportunityUseCase', {
    useClass: CreateOpportunityUseCaseImpl,
  });
