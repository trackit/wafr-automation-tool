import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessments = async ({
  limit = 10,
  search,
  nextToken,
}: operations['getAssessments']['parameters']['query'] = {}): Promise<
  operations['getAssessments']['responses']['200']['content']['application/json']
> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (nextToken) params.set('nextToken', nextToken);

  return apiClient.get(`/assessments?${params.toString()}`);
};
