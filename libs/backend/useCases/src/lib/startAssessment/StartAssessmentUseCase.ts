import {
  tokenAssessmentsStateMachine,
  tokenIdGenerator,
  tokenLogger,
  tokenMarketplaceService,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError, PaymentRequiredError } from '../Errors';

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
  private readonly idGenerator = inject(tokenIdGenerator);
  private readonly logger = inject(tokenLogger);

  public async canStartAssessment(
    args: StartAssessmentUseCaseArgs
  ): Promise<boolean> {
    const organization = await this.organizationRepository.get({
      organizationDomain: args.user.organizationDomain,
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    const monthly = await this.marketplaceService.hasMonthlySubscription({
      customerAccountId: organization.accountId,
    });
    if (monthly) {
      this.logger.info(`User ${args.user.id} has a monthly subscription`);
      return true;
    }
    const perUnit = await this.marketplaceService.hasUnitBasedSubscription({
      agreementId: organization.unitBasedAgreementId,
    });
    if (perUnit) {
      this.logger.info(`User ${args.user.id} has a per unit subscription`);
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
      throw new PaymentRequiredError("You don't have a subscription");
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
