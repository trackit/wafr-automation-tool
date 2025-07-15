import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenMarketplaceService,
  tokenObjectsStorage,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { AssessmentStep } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { NotFoundError } from '../Errors';

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
  private readonly assessmentsStorage = inject(tokenObjectsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly marketplaceService = inject(tokenMarketplaceService);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly logger = inject(tokenLogger);
  private readonly debug = inject(tokenDebug);

  public async cleanupError(args: CleanupUseCaseArgs): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.organization,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.organization}`
      );
    }
    if (!this.debug) {
      await this.assessmentsRepository.deleteFindings({
        assessmentId: assessment.id,
        organization: assessment.organization,
      });
      this.logger.info(`Deleting findings for assessment ${assessment.id}`);
    }
    await this.assessmentsRepository.update({
      assessmentId: assessment.id,
      organization: assessment.organization,
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
    const organization = await this.organizationRepository.get({
      organizationDomain: args.organization,
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    if (
      organization.freeAssessmentsLeft &&
      organization.freeAssessmentsLeft > 0
    ) {
      this.logger.info(`Consume free assessment for ${args.organization}`);
      organization.freeAssessmentsLeft--;
      await this.organizationRepository.save({
        organization,
      });
      return;
    }
    const monthly = await this.marketplaceService.hasMonthlySubscription({
      organization,
    });
    if (!monthly) {
      const perUnit = await this.marketplaceService.hasUnitBasedSubscription({
        organization,
      });
      if (perUnit) {
        this.logger.info(
          `Consume review unit for ${args.organization} because it is not a monthly subscription`
        );
        await this.marketplaceService.consumeReviewUnit({
          organization,
        });
      } else {
        throw new NotFoundError(
          `Organization ${args.organization} does not have a subscription`
        );
      }
    }
  }

  public async cleanup(args: CleanupUseCaseArgs): Promise<void> {
    if (!this.debug) {
      const listObjects = await this.assessmentsStorage.list(
        `assessments/${args.assessmentId}`
      );
      this.logger.info(`Deleting assessment: ${listObjects}`);
      this.assessmentsStorage.bulkDelete(listObjects);
      this.logger.info(`Debug mode is disabled, deleting assessment`);
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
