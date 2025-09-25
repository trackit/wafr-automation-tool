import { BasicErrorType } from '@shared/utils';

import { HandlerError } from './HandlerError';

export class MilestoneInvalidIdError extends HandlerError {
  public constructor(args: { milestoneId: string }, description?: string) {
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `Invalid milestoneId: ${args.milestoneId}`,
      description,
    });
  }
}
