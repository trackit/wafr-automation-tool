import { STSClient } from '@aws-sdk/client-sts';

import { createInjectionToken } from '@shared/di-container';

export const tokenSTSClient = createInjectionToken<STSClient>('STSClient', {
  useClass: STSClient,
});
