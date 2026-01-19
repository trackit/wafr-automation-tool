import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function getMilestones(
  pathParams: operations['getMilestones']['parameters']['path'],
  queryParams: operations['getMilestones']['parameters']['query'] = {},
): Promise<
  operations['getMilestones']['responses']['200']['content']['application/json']
> {
  const { assessmentId } = pathParams;
  const { region, limit = 10, nextToken } = queryParams;

  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (limit) params.set('limit', limit.toString());
  if (nextToken) params.set('nextToken', nextToken);

  return apiClient.get(
    `/assessments/${assessmentId}/milestones?${params.toString()}`,
  );
}

export default getMilestones;
