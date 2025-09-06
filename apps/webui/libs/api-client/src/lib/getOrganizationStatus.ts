import { operations } from '@shared/api-schema';
import { apiClient } from './client';

export const getOrganizationStatus = async () => {
  return apiClient.get<
    operations['getOrganizationStatus']['responses']['200']['content']['application/json']
  >(`/organization/status`);
};

export default getOrganizationStatus;
