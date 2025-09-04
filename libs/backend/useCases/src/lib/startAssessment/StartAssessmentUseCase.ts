import {
  tokenAssessmentsStateMachine,
  tokenFeatureToggleRepository,
  tokenIdGenerator,
  tokenLogger,
  tokenMarketplaceService,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  OrganizationNoActiveSubscriptionError,
  OrganizationNotFoundError,
} from '../../errors';

export type StartAssessmentUseCaseArgs = {
  name: string;
  user: User;
  regions?: string[];
  roleArn: string;
  workflows?: string[];
};

export interface StartAssessmentUseCase {
  startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }>;
}

export class StartAssessmentUseCaseImpl implements StartAssessmentUseCase {
  private readonly stateMachine = inject(tokenAssessmentsStateMachine);
  private readonly marketplaceService = inject(tokenMarketplaceService);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly featureToggleRepository = inject(
    tokenFeatureToggleRepository
  );
  private readonly idGenerator = inject(tokenIdGenerator);
  private readonly logger = inject(tokenLogger);

  public async canStartAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<boolean> {
    const organization = await this.organizationRepository.get({
      organizationDomain: args.user.organizationDomain,
    });
    if (!organization) {
      throw new OrganizationNotFoundError({
        organization: args.user.organizationDomain,
      });
    }
    if (
      organization.freeAssessmentsLeft &&
      organization.freeAssessmentsLeft > 0
    ) {
      this.logger.info(
        `User ${args.user.id} has ${organization.freeAssessmentsLeft} free assessments left`
      );
      return true;
    }
    if (!this.featureToggleRepository.marketplaceIntegration()) {
      this.logger.info(
        `Marketplace integration is disabled, not checking for subscription`
      );
      return true;
    }
    const monthly = await this.marketplaceService.hasMonthlySubscription({
      organization,
    });
    if (monthly) {
      this.logger.info(`User ${args.user.id} has a monthly subscription`);
      return true;
    }
    const perUnit = await this.marketplaceService.hasUnitBasedSubscription({
      organization,
    });
    if (perUnit) {
      this.logger.info(`User ${args.user.id} has a unit based subscription`);
      return true;
    }
    this.logger.info(`User ${args.user.id} does not have a subscription`);
    return false;
  }

  public async startAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<{ assessmentId: string }> {
    const { name, user, roleArn } = args;
    const assessmentId = this.idGenerator.generate();
    const workflows =
      args.workflows?.map((workflow) => workflow.toLowerCase()) ?? [];
    const regions = args.regions ?? [];

    if (!(await this.canStartAssessment(args))) {
      throw new OrganizationNoActiveSubscriptionError({
        organization: user.organizationDomain,
      });
    }
    await this.stateMachine.startAssessment({
      name,
      regions,
      workflows,
      roleArn,
      assessmentId,
      createdAt: new Date(),
      createdBy: user.id,
      organization: user.organizationDomain,
    });
    return { assessmentId };
  }
}

export const tokenStartAssessmentUseCase =
  createInjectionToken<StartAssessmentUseCase>('StartAssessmentUseCase', {
    useClass: StartAssessmentUseCaseImpl,
  });
