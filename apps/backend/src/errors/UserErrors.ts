import { BasicErrorType } from '@shared/utils';

import { HandlerError } from './HandlerError';

export class UserClaimsMissingError extends HandlerError {
  public constructor(description?: string) {
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `The user claims are missing`,
      description,
    });
  }
}
