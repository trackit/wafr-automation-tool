import { apiClient } from './client';
import { paths } from '@webui/types';

export const getAssessment = async (assessmentId: string) => {
  return apiClient.get<
    paths['/assessments/{assessmentId}']['get']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}`);
};
