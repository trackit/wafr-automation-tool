import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';

import { AssumedCredentials, STSPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';

export const tokenSTSClient = createInjectionToken<STSClient>('STSClient', {
  useClass: STSClient,
});

export class STSService implements STSPort {
  private readonly client = inject(tokenSTSClient);
  private readonly logger = inject(tokenLogger);
  public async assumeRole({
    roleArn,
    sessionName = 'WAFR-Automation-Tool',
    externalId,
    durationSeconds,
  }: {
    roleArn: string;
    sessionName?: string;
    externalId?: string;
    durationSeconds?: number;
  }): Promise<AssumedCredentials | null> {
    const cmd = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: sessionName,
      ...(externalId ? { ExternalId: externalId } : {}),
      ...(durationSeconds ? { DurationSeconds: durationSeconds } : {}),
    });
    try {
      const res = await this.client.send(cmd);
      const c = res.Credentials;
      if (
        !c?.AccessKeyId ||
        !c.SecretAccessKey ||
        !c.SessionToken ||
        !c.Expiration
      ) {
        this.logger.warn('AssumeRole returned incomplete credentials', roleArn);
        return null;
      }
      this.logger.info(
        `Assumed role ${roleArn} until ${c.Expiration.toISOString()}`
      );
      return {
        accessKeyId: c.AccessKeyId,
        secretAccessKey: c.SecretAccessKey,
        sessionToken: c.SessionToken,
        expiration: c.Expiration,
        roleArn,
      };
    } catch (err) {
      this.logger.error(`AssumeRole failed for ${roleArn}: ${String(err)}`);
      throw err;
    }
  }
}

export const tokenSTSService = createInjectionToken<STSService>('STSService', {
  useClass: STSService,
});
