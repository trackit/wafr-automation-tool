import {
  tokenAssessmentsRepository,
  tokenAssessmentsStorage,
  tokenLogger,
} from '@backend/infrastructure';
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
  execute(args: CleanupUseCaseArgs): Promise<void>;
}

export class CleanupUseCaseImpl implements CleanupUseCase {
  private readonly assessmentsStorage = inject(tokenAssessmentsStorage);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);
  public debug = inject(tokenDebug);

  public async execute(args: CleanupUseCaseArgs): Promise<void> {
    if (!this.debug) {
      this.assessmentsStorage.delete(args.assessmentId);
      this.logger.info(`Debug mode is disabled, deleting assessment`);
    }
    if (args.error) {
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
