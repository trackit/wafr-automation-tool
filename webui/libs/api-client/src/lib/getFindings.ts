import { apiClient } from './client';
import { components } from '@webui/types';
export const getFindings = async (
  assessmentId: string,
  bestPractice: string
) => {
  return apiClient.get<components['schemas']['BestPracticeExtra']>(
    `/assessments/${assessmentId}/best-practices/${encodeURIComponent(
      bestPractice
    )}`
  );
};
