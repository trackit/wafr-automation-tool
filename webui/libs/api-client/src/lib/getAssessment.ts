import { apiClient } from './client';
import { operations } from '@webui/types';

export const getAssessment = async (assessmentId: string) => {
  return apiClient.get<
    operations['getAssessment']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}`);
};
