import { apiClient } from './client';
import { paths } from '@shared/api-schema';

export const getAssessments = async ({
  limit = 10,
  search,
  next_token,
}: paths['/assessments']['get']['parameters']['query'] = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (next_token) params.set('next_token', next_token);

  return apiClient.get<
    paths['/assessments']['get']['responses']['200']['content']['application/json']
  >(`/assessments?${params.toString()}`);
};
