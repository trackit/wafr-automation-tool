import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export async function getAssessmentVersions(
  pathParams: operations['getAssessmentVersions']['parameters']['path'],
  queryParams: operations['getAssessmentVersions']['parameters']['query'] = {},
): Promise<
  operations['getAssessmentVersions']['responses']['200']['content']['application/json']
> {
  const { assessmentId } = pathParams;
  const { limit = 10, nextToken } = queryParams;

  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (nextToken) params.set('nextToken', nextToken);
  return apiClient.get(
    `/assessments/${assessmentId}/versions?${params.toString()}`,
  );
}

export default getAssessmentVersions;
