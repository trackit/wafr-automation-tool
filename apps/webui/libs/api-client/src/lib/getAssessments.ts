import { apiClient } from './client';
import { paths } from '@shared/api-schema';

export const getAssessments = async ({
  limit = 10,
  search,
  nextToken,
}: paths['/assessments']['get']['parameters']['query'] = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (nextToken) params.set('nextToken', nextToken);

  return apiClient.get<
    paths['/assessments']['get']['responses']['200']['content']['application/json']
  >(`/assessments?${params.toString()}`);
};
