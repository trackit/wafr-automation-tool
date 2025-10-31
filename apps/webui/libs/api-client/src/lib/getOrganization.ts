import { paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getOrganization = async () => {
  return apiClient.get<
    paths['/organization']['get']['responses']['200']['content']['application/json']
  >(`/organization`);
};
