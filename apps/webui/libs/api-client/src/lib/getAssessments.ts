import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessments = async ({
  limit = 10,
  search,
  nextToken,
  folder,
}: paths['/assessments']['get']['parameters']['query'] = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (nextToken) params.set('nextToken', nextToken);
  if (folder !== undefined) params.set('folder', folder);

  return apiClient.get<
    paths['/assessments']['get']['responses']['200']['content']['application/json']
  >(`/assessments?${params.toString()}`);
};
