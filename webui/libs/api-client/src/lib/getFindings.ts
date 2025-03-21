import { apiClient } from './client';

export const getFindings = async (
  assessmentId: string,
  bestPractice: string
) => {
  return apiClient.get(
    `/assessments/${assessmentId}/best-practices/${encodeURIComponent(
      bestPractice
    )}`
  );
};
