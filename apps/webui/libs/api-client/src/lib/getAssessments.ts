import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessments = async ({
  limit = 10,
  search,
  nextToken,
}: paths['/assessments']['get']['parameters']['query'] = {}): Promise<
  paths['/assessments']['get']['responses']['200']['content']['application/json']
> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (nextToken) params.set('nextToken', nextToken);

  return apiClient.get(`/assessments?${params.toString()}`);
};
