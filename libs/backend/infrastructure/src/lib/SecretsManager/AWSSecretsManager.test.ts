import {
  GetSecretValueCommand,
  SecretsManagerServiceException,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { AWSSecretsManager, tokenSecretsManagerClient } from './index';

describe('AWSSecretsManager Infrastructure', () => {
  describe('getSecretValue', () => {
    it('should get a secret value', async () => {
      const { secretsManager, secretsManagerClientMock } = setup();
      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        SecretString: 'my-secret-value',
      });
      await expect(
        secretsManager.getSecretValue(
          'arn:aws:secretsmanager:region:123456789012:secret:mysecret'
        )
      ).resolves.toBe('my-secret-value');
    });

    it('should throw an error if SecretString is not found', async () => {
      const { secretsManager, secretsManagerClientMock } = setup();
      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });
      await expect(
        secretsManager.getSecretValue(
          'arn:aws:secretsmanager:region:123456789012:secret:mysecret'
        )
      ).rejects.toThrowError();
    });

    it('should throw an error if getSecretValue fails', async () => {
      const { secretsManager, secretsManagerClientMock } = setup();
      secretsManagerClientMock.on(GetSecretValueCommand).rejects(
        new SecretsManagerServiceException({
          name: 'InternalError',
          $fault: 'server',
          $metadata: { httpStatusCode: 500 },
        })
      );
      await expect(
        secretsManager.getSecretValue(
          'arn:aws:secretsmanager:region:123456789012:secret:mysecret'
        )
      ).rejects.toThrowError();
    });
  });

  describe('getDatabaseCredentialsSecret', () => {
    it('should get and parse database credentials secret', async () => {
      const { secretsManager, secretsManagerClientMock } = setup();
      const secretValue = JSON.stringify({
        username: 'dbuser',
        password: 'dbpassword',
      });
      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        SecretString: secretValue,
      });
      await expect(
        secretsManager.getDatabaseCredentialsSecret(
          'arn:aws:secretsmanager:region:123456789012:secret:dbcredentials'
        )
      ).resolves.toEqual({
        username: 'dbuser',
        password: 'dbpassword',
      });
    });

    it('should throw an error if secret value is not valid JSON', async () => {
      const { secretsManager, secretsManagerClientMock } = setup();
      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        SecretString: 'invalid-json',
      });
      await expect(
        secretsManager.getDatabaseCredentialsSecret(
          'arn:aws:secretsmanager:region:123456789012:secret:dbcredentials'
        )
      ).rejects.toThrowError();
    });

    it('should throw an error if required fields are missing', async () => {
      const { secretsManager, secretsManagerClientMock } = setup();
      const secretValue = JSON.stringify({
        username: 'dbuser',
      });
      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        $metadata: { httpStatusCode: 200 },
        SecretString: secretValue,
      });
      await expect(
        secretsManager.getDatabaseCredentialsSecret(
          'arn:aws:secretsmanager:region:123456789012:secret:dbcredentials'
        )
      ).rejects.toThrowError();
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const secretsManager = new AWSSecretsManager();
  const secretsManagerClientMock = mockClient(
    inject(tokenSecretsManagerClient)
  );
  return {
    secretsManager,
    secretsManagerClientMock,
  };
};
