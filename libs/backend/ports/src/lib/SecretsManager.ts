export interface DBCredentials {
  username: string;
  password: string;
}

export interface SecretsManager {
  getSecretValue(secretId: string): Promise<string>;
  getDatabaseCredentialsSecret(secretId: string): Promise<DBCredentials>;
}
