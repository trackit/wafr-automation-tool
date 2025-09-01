import { paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessment = async (assessmentId: string) => {
  return apiClient.get<
    paths['/assessments/{assessmentId}']['get']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}`);
};
