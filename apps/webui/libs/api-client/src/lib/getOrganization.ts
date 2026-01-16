import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getOrganization = async (): Promise<
  paths['/organization']['get']['responses']['200']['content']['application/json']
> => {
  return apiClient.get(`/organization`);
};
