import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

import { SecretsManager } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

export class AWSSecretsManager implements SecretsManager {
  private readonly client = inject(tokenSecretsManagerClient);

  async getSecretValue(secretId: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await this.client.send(command);
    if (!response.SecretString) {
      throw new Error(`SecretString not found for ARN: ${secretId}`);
    }
    return response.SecretString;
  }
}

export const tokenSecretsManager = createInjectionToken<SecretsManager>(
  'SecretsManager',
  {
    useClass: AWSSecretsManager,
  }
);

export const tokenSecretsManagerClient =
  createInjectionToken<SecretsManagerClient>('SecretsManagerClient', {
    useClass: SecretsManagerClient,
  });
