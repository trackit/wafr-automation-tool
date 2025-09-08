import { ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { CognitoService, tokenCognitoClient } from './CognitoService';

describe('CognitoService', () => {
  describe('getUserById', () => {
    it('should get a user by id', async () => {
      const { service, cognitoClientMock } = setup();

      cognitoClientMock.on(ListUsersCommand).resolves({
        Users: [
          {
            Username: 'test-user',
            Attributes: [
              {
                Name: 'email',
                Value: 'test-user@test.io',
              },
            ],
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });
      const user = await service.getUserById({ userId: 'test-user' });
      expect(user).toEqual({
        id: 'test-user',
        email: 'test-user@test.io',
        organizationDomain: 'test.io',
      });
      const listUsersCalls = cognitoClientMock.commandCalls(ListUsersCommand);
      expect(listUsersCalls.length).toBe(1);
      expect(listUsersCalls[0].args[0].input).toEqual({
        UserPoolId: 'COGNITO_USER_POOL_ID',
        Filter: `sub = "test-user"`,
        Limit: 1,
      });
    });
    it('should throw an error if the request fails', async () => {
      const { service, cognitoClientMock } = setup();

      cognitoClientMock.on(ListUsersCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });
      await expect(
        service.getUserById({ userId: 'test-user' })
      ).rejects.toThrow(Error);
    });
    it('should throw an error if the user is not found', async () => {
      const { service, cognitoClientMock } = setup();

      cognitoClientMock.on(ListUsersCommand).resolves({
        Users: [],
        $metadata: { httpStatusCode: 200 },
      });
      await expect(
        service.getUserById({ userId: 'test-user' })
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const service = new CognitoService();
  const cognitoClientMock = mockClient(inject(tokenCognitoClient));
  return { service, cognitoClientMock };
};
