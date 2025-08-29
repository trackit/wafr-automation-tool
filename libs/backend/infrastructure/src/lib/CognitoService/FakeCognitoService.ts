import { User } from '@backend/models';
import { CognitoPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

import { UserNotFoundError } from '../../Errors';

export class FakeCognitoService implements CognitoPort {
  private user = {
    id: 'user-id',
    email: 'test-user@test.io',
    organizationDomain: 'test.io',
  };

  public async getUserById(args: { userId: string }): Promise<User> {
    if (args.userId !== this.user.id) {
      throw new UserNotFoundError({ userId: args.userId });
    }
    return this.user;
  }
}

export const tokenFakeCognitoService = createInjectionToken<FakeCognitoService>(
  'FakeCognitoService',
  {
    useClass: FakeCognitoService,
  }
);
