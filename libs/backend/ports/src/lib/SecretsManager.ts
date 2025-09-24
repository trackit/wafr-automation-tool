export interface SecretsManager {
  getSecretValue(secretId: string): Promise<string>;
}
