import { paths } from '@shared/api-schema';

import { apiClient } from './client';

export function getMilestones(
  pathParams: paths['/assessments/{assessmentId}/milestones']['get']['parameters']['path'],
  queryParams: paths['/assessments/{assessmentId}/milestones']['get']['parameters']['query'] = {},
) {
  const { assessmentId } = pathParams;
  const { region, limit = 10, nextToken } = queryParams;

  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (limit) params.set('limit', limit.toString());
  if (nextToken) params.set('nextToken', nextToken);

  return apiClient.get<
    paths['/assessments/{assessmentId}/milestones']['get']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}/milestones?${params.toString()}`);
}

export default getMilestones;
