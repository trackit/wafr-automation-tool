import { BasicError, type BasicErrorArgs } from '@shared/utils';

export abstract class UseCaseError extends BasicError {
  public constructor(args: BasicErrorArgs) {
    super(args);
  }
}
