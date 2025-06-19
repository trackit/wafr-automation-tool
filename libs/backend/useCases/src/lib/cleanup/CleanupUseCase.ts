import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenObjectsStorage,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { format } from 'util';
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

export const ASSESSMENTS_PATH = 'assessments/%s';

export class CleanupUseCaseImpl implements CleanupUseCase {
  private readonly assessmentsStorage = inject(tokenObjectsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);
  private readonly debug = inject(tokenDebug);

  private async cleanupError(args: CleanupUseCaseArgs): Promise<void> {
    if (!args.error) return Promise.resolve();
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
        error: {
          error: args.error.Error,
          cause: args.error.Cause,
        },
      },
    });
    this.logger.info(
      `Updating assessment ${assessment.id} with error ${args.error.Error} caused by ${args.error.Cause}`
    );
  }

  public async cleanup(args: CleanupUseCaseArgs): Promise<void> {
    if (!this.debug) {
      const listObjects = await this.assessmentsStorage.list({
        prefix: format(ASSESSMENTS_PATH, args.assessmentId),
      });
      this.logger.info(`Deleting assessment: ${listObjects}`);
      this.assessmentsStorage.bulkDelete({
        keys: listObjects,
      });
      this.logger.info(`Debug mode is disabled, deleting assessment`);
    }
    await this.cleanupError(args);
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
