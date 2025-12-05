import { BasicError, type BasicErrorArgs } from '@shared/utils';

export abstract class HandlerError extends BasicError {
  public constructor(args: BasicErrorArgs) {
    super(args);
  }
}
