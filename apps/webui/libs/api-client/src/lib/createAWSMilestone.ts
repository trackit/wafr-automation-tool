import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function createAWSMilestone(
  {
    assessmentId,
  }: paths['/assessments/{assessmentId}/exports/create-milestone']['post']['parameters']['path'],
  requestBody: paths['/assessments/{assessmentId}/exports/create-milestone']['post']['requestBody']['content']['application/json'],
): Promise<
  paths['/assessments/{assessmentId}/exports/create-milestone']['post']['responses']['200']['content']
> {
  return apiClient.post(
    `/assessments/${assessmentId}/exports/create-milestone`,
    requestBody,
  );
}

export default createAWSMilestone;
