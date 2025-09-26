import { SecretsManager } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeSecretsManager implements SecretsManager {
  public secrets: Record<string, string> = {};

  public async getSecretValue(secretId: string): Promise<string> {
    const secret = this.secrets[secretId];
    if (!secret) {
      throw new Error(`SecretString not found for ARN: ${secretId}`);
    }
    return secret;
  }
}

export const tokenFakeSecretsManager = createInjectionToken<SecretsManager>(
  'FakeSecretsManager',
  {
    useClass: FakeSecretsManager,
  }
);
