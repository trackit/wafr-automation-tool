export type AssumedCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
  roleArn: string;
};

export interface STSPort {
  assumeRole(args: {
    roleArn: string;
    sessionName: string;
    externalId?: string;
    durationSeconds?: number;
  }): Promise<AssumedCredentials | null>;
}
