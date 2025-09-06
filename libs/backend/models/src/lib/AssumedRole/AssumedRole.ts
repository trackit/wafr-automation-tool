export interface AssumedRole {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
  roleArn: string;
}
