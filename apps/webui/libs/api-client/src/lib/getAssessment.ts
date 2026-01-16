import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessment = async (
  assessmentId: string,
): Promise<
  operations['getAssessment']['responses']['200']['content']['application/json']
> => {
  return apiClient.get(`/assessments/${assessmentId}`);
};
