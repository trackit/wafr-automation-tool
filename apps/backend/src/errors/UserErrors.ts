import { HandlerError } from './HandlerError';

export class UserClaimsMissingError extends HandlerError {
  public constructor(description?: string) {
    super({
      type: 'BAD_REQUEST',
      message: `The user claims are missing`,
      description,
    });
  }
}
