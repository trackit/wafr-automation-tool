import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function createAWSMilestone(
  { assessmentId }: operations['createMilestone']['parameters']['path'],
  requestBody: operations['createMilestone']['requestBody']['content']['application/json'],
): Promise<operations['createMilestone']['responses']['200']['content']> {
  return apiClient.post(
    `/assessments/${assessmentId}/exports/create-milestone`,
    requestBody,
  );
}

export default createAWSMilestone;
