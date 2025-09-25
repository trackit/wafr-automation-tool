import { BasicError, BasicErrorArgs } from '@shared/utils';

export abstract class UseCaseError extends BasicError {
  public constructor(args: BasicErrorArgs) {
    super(args);
  }
}
