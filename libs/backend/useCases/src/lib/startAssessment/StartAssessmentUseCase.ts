import {
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
  tokenFeatureToggleRepository,
  tokenIdGenerator,
  tokenLogger,
  tokenMarketplaceService,
  tokenOrganizationRepository,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import { Assessment, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  OrganizationAccountIdNotSetError,
  OrganizationNoActiveSubscriptionError,
  OrganizationNotFoundError,
  OrganizationUnitBasedAgreementIdNotSetError,
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
  private readonly questionSetService = inject(tokenQuestionSetService);
  private readonly marketplaceService = inject(tokenMarketplaceService);
  private readonly assessmentRepository = inject(tokenAssessmentsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly featureToggleRepository = inject(
    tokenFeatureToggleRepository
  );
  private readonly idGenerator = inject(tokenIdGenerator);
  private readonly logger = inject(tokenLogger);

  public async canStartAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<boolean> {
    const organization = await this.organizationRepository.get(
      args.user.organizationDomain
    );
    if (!organization) {
      throw new OrganizationNotFoundError({
        domain: args.user.organizationDomain,
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

    if (!organization.accountId) {
      throw new OrganizationAccountIdNotSetError({
        domain: organization.domain,
      });
    }
    const monthly = await this.marketplaceService.hasMonthlySubscription({
      accountId: organization.accountId,
    });
    if (monthly) {
      this.logger.info(`User ${args.user.id} has a monthly subscription`);
      return true;
    }

    if (!organization.unitBasedAgreementId) {
      throw new OrganizationUnitBasedAgreementIdNotSetError({
        domain: organization.domain,
      });
    }
    const perUnit = await this.marketplaceService.hasUnitBasedSubscription({
      unitBasedAgreementId: organization.unitBasedAgreementId,
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
        domain: user.organizationDomain,
      });
    }
    const executionId = await this.stateMachine.startAssessment({
      name,
      regions,
      workflows,
      roleArn,
      assessmentId,
      createdAt: new Date(),
      createdBy: user.id,
      organizationDomain: user.organizationDomain,
    });

    const questionSet = this.questionSetService.get();

    const assessment: Assessment = {
      id: assessmentId,
      name,
      regions,
      workflows,
      roleArn,
      createdAt: new Date(),
      createdBy: user.id,
      organization: user.organizationDomain,
      executionArn: executionId,
      fileExports: [],
      questionVersion: questionSet.version,
      pillars: questionSet.pillars,
      finished: false,
    };
    await this.assessmentRepository.save(assessment);
    return { assessmentId };
  }
}

export const tokenStartAssessmentUseCase =
  createInjectionToken<StartAssessmentUseCase>('StartAssessmentUseCase', {
    useClass: StartAssessmentUseCaseImpl,
  });
