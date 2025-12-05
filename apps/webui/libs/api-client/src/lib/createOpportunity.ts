import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function createOpportunity(
  { assessmentId }: operations['createOpportunity']['parameters']['path'],
  body: operations['createOpportunity']['requestBody']['content']['application/json'],
) {
  return apiClient.post(`/assessments/${assessmentId}/opportunities`, body);
}

export default createOpportunity;
