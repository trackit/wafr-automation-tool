import { apiClient } from './client';

export const updateStatus = async (
  assessmentId: string,
  bestPractice: string,
  status: boolean
) => {
  return apiClient.put(
    `/assessments/${assessmentId}/best-practices/${encodeURIComponent(
      bestPractice
    )}/${status}`,
    {}
  );
};
