import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class DatabaseUnavailableError extends UseCaseError {
  public constructor(description?: string) {
    super({
      type: BasicErrorType.SERVICE_UNAVAILABLE,
      message: `Database is currently unavailable.`,
      description:
        description ||
        'The database connection could not be established. This may be due to a cold start or temporary unavailability.',
    });
  }
}
