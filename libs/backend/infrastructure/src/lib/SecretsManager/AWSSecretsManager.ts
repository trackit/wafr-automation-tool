import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import z from 'zod';

import { type DBCredentials, type SecretsManager } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';

const DBCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
}) satisfies z.ZodType<DBCredentials>;

export class AWSSecretsManager implements SecretsManager {
  private readonly client = inject(tokenSecretsManagerClient);

  public async getSecretValue(secretId: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await this.client.send(command);
    if (!response.SecretString) {
      throw new Error(`SecretString not found for ARN: ${secretId}`);
    }
    return response.SecretString;
  }

  public async getDatabaseCredentialsSecret(
    secretId: string,
  ): Promise<DBCredentials> {
    const secretValue = await this.getSecretValue(secretId);
    return DBCredentialsSchema.parse(parseJsonObject(secretValue));
  }
}

export const tokenSecretsManager = createInjectionToken<SecretsManager>(
  'SecretsManager',
  {
    useClass: AWSSecretsManager,
  },
);

export const tokenSecretsManagerClient =
  createInjectionToken<SecretsManagerClient>('SecretsManagerClient', {
    useClass: SecretsManagerClient,
  });
