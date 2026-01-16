import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const getOrganization = async (): Promise<
  operations['getOrganization']['responses']['200']['content']['application/json']
> => {
  return apiClient.get(`/organization`);
};
