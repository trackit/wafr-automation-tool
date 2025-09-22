import {
  tokenAssessmentsRepository,
  tokenFeatureToggleRepository,
  tokenFindingsRepository,
  tokenLogger,
  tokenMarketplaceService,
  tokenObjectsStorage,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { AssessmentStep } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import {
  AssessmentNotFoundError,
  OrganizationAccountIdNotSetError,
  OrganizationNotFoundError,
  OrganizationSubscriptionNotFoundError,
  OrganizationUnitBasedAgreementIdNotSetError,
} from '../../errors';

export type StateMachineError = {
  Cause: string;
  Error: string;
};

export type CleanupUseCaseArgs = {
  assessmentId: string;
  organization: string;
  error?: StateMachineError;
};

export interface CleanupUseCase {
  cleanup(args: CleanupUseCaseArgs): Promise<void>;
}

export class CleanupUseCaseImpl implements CleanupUseCase {
  private readonly objectsStorage = inject(tokenObjectsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly marketplaceService = inject(tokenMarketplaceService);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly featureToggleRepository = inject(
    tokenFeatureToggleRepository
  );
  private readonly logger = inject(tokenLogger);
  private readonly debug = inject(tokenDebug);

  public async cleanupError(args: CleanupUseCaseArgs): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.organization,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.organization,
      });
    }
    if (!this.debug) {
      await this.findingsRepository.deleteAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      this.logger.info(`Deleting findings for assessment ${assessment.id}`);
    }
    await this.assessmentsRepository.update({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      assessmentBody: {
        step: AssessmentStep.ERRORED,
        error: args.error
          ? {
              error: args.error.Error,
              cause: args.error.Cause,
            }
          : undefined,
      },
    });
    this.logger.info(
      `Updating assessment ${assessment.id} with error ${args.error?.Error} caused by ${args.error?.Cause}`
    );
  }

  public async cleanupSuccessful(args: CleanupUseCaseArgs) {
    const organization = await this.organizationRepository.get(
      args.organization
    );
    if (!organization) {
      throw new OrganizationNotFoundError({ domain: args.organization });
    }
    if (
      organization.freeAssessmentsLeft &&
      organization.freeAssessmentsLeft > 0
    ) {
      this.logger.info(`Consume free assessment for ${args.organization}`);
      organization.freeAssessmentsLeft--;
      await this.organizationRepository.save(organization);
      return;
    }
    if (!this.featureToggleRepository.marketplaceIntegration()) {
      this.logger.info(
        `Marketplace integration is disabled, not consuming any subscription`
      );
      return;
    }
    if (!organization.accountId) {
      throw new OrganizationAccountIdNotSetError({
        domain: organization.domain,
      });
    }
    const monthly = await this.marketplaceService.hasMonthlySubscription({
      accountId: organization.accountId,
    });
    if (!monthly) {
      if (!organization.unitBasedAgreementId) {
        throw new OrganizationUnitBasedAgreementIdNotSetError({
          domain: organization.domain,
        });
      }
      const perUnit = await this.marketplaceService.hasUnitBasedSubscription({
        unitBasedAgreementId: organization.unitBasedAgreementId,
      });
      if (perUnit) {
        this.logger.info(
          `Consume review unit for ${args.organization} because it is not a monthly subscription`
        );
        await this.marketplaceService.consumeReviewUnit({
          accountId: organization.accountId,
        });
      } else {
        throw new OrganizationSubscriptionNotFoundError({
          domain: args.organization,
        });
      }
    }
  }

  public async cleanup(args: CleanupUseCaseArgs): Promise<void> {
    if (!this.debug) {
      const listObjects = await this.objectsStorage.list(
        `assessments/${args.assessmentId}`
      );
      this.logger.info(`Deleting assessment: ${listObjects}`);
      if (listObjects.length !== 0) {
        await this.objectsStorage.bulkDelete(listObjects);
        this.logger.info(`Debug mode is disabled, deleting assessment`);
      } else {
        this.logger.info(`Debug mode is disabled, nothing to delete`);
      }
    }
    try {
      if (args.error) {
        await this.cleanupError(args);
      } else {
        await this.cleanupSuccessful(args);
      }
    } catch (err) {
      this.logger.error(`Failed to perform cleanup: ${err}`);
      throw err;
    }
  }
}

export const tokenCleanupUseCase = createInjectionToken<CleanupUseCase>(
  'CleanupUseCase',
  {
    useClass: CleanupUseCaseImpl,
  }
);

export const tokenDebug = createInjectionToken<boolean>('Debug', {
  useFactory: () => {
    const debug = process.env.DEBUG;
    assertIsDefined(debug, 'DEBUG is not defined');
    return debug === 'true';
  },
});
