import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessment = async (
  assessmentId: string,
): Promise<
  paths['/assessments/{assessmentId}']['get']['responses']['200']['content']['application/json']
> => {
  return apiClient.get(`/assessments/${assessmentId}`);
};
